import { createPendingWorkshop } from './utils/db.js';
import { sendEmail, formatAdminNotificationEmail, formatApplicantConfirmationEmail } from './utils/email.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Prevent silent failures: if DB env var isn't set in Netlify Production, we can't write the pending record
  if (!process.env.DATABASE_URL) {
    console.error('[GW SUBMIT] DATABASE_URL is missing in this environment.');
    return {
      statusCode: 302,
      headers: { Location: '/guided-workshops/apply?error=database_not_configured' }
    };
  }

  let data;
  
  const contentType = event.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    try {
      data = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, body: 'Invalid JSON' };
    }
  } else {
    const params = new URLSearchParams(event.body);
    data = {};
    for (const [key, value] of params) {
      data[key] = value;
    }
  }

  if (data.company && data.company.trim() !== '') {
    return {
      statusCode: 302,
      headers: { Location: '/guided-workshop/thanks' }
    };
  }

  // Server-side validation for startFromBeginning gate
  const startFromBeginning = data.startFromBeginning;
  if (startFromBeginning !== 'yes' && startFromBeginning !== 'no_in_progress') {
    return {
      statusCode: 302,
      headers: { Location: '/guided-workshops/apply?error=invalid-start' }
    };
  }

  if (startFromBeginning === 'no_in_progress') {
    return {
      statusCode: 302,
      headers: { Location: '/guided-workshops/apply?error=not-fresh' }
    };
  }

  // Support both new firstName/lastName fields and legacy fullName field
  let firstName = (data.firstName || '').trim();
  let lastName = (data.lastName || '').trim();
  
  // Fallback: parse fullName if firstName/lastName are empty (legacy form submissions)
  if (!firstName && !lastName && data.fullName) {
    const nameParts = data.fullName.trim().split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  const applicantName = [firstName, lastName].filter(Boolean).join(' ');
  const applicantEmail = data.email?.trim() || '';

  const applicationData = {
    firstName: firstName,
    lastName: lastName,
    email: data.email,
    projectDirection: data.projectDirection,
    startFromBeginning: data.startFromBeginning,
    machineModel: data.machineModel,
    machineComfortLevel: data.machineComfortLevel,
    experienceLevel: data.experienceLevel,
    patternStatus: data.patternStatus,
    patternReference: data.patternReference || null,
    yarnStatus: data.yarnStatus,
    startWindow: data.startWindow,
    confirm: data.confirm,
    submittedAt: new Date().toISOString(),
  };

  let workshopId = null;

  const dbResult = await createPendingWorkshop({
    applicantName,
    applicantEmail,
    applicationData,
  });

  if (dbResult.success) {
    workshopId = dbResult.workshopId;
    console.log(`[GW SUBMIT] Created pending workshop: ${workshopId}`);
  } else {
    console.error('[GW SUBMIT] Failed to create pending workshop:', dbResult);
    const reason = dbResult?.reason || 'unknown_error';
    return {
      statusCode: 302,
      headers: { Location: `/guided-workshops/apply?error=${encodeURIComponent(reason)}` }
    };
  }

  if (workshopId) {
    const adminEmail = process.env.ADMIN_NOTIFICATIONS_EMAIL;
    if (adminEmail) {
      const adminNotification = formatAdminNotificationEmail({
        workshopId,
        applicantName,
        applicantEmail,
        applicationData,
      });
      await sendEmail({
        to: adminEmail,
        ...adminNotification,
      });
    } else {
      console.warn('ADMIN_NOTIFICATIONS_EMAIL not configured, skipping admin notification');
    }

    if (applicantEmail) {
      const applicantConfirmation = formatApplicantConfirmationEmail({
        workshopId,
        applicantName,
      });
      await sendEmail({
        to: applicantEmail,
        ...applicantConfirmation,
      });
    }
  }

  const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL;
  const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
  const AC_LIST_ID = process.env.ACTIVECAMPAIGN_LIST_ID_KBM;
  const AC_TAG_ID = process.env.ACTIVECAMPAIGN_TAG_ID_GW_APPLIED;

  if (AC_API_URL && AC_API_KEY) {
    // ActiveCampaign receives identity + automation data only.
    // Full application data is stored in the KBM admin/database.
    console.log('[AC] Starting ActiveCampaign sync for:', data.email);
    console.log('[AC] List ID:', AC_LIST_ID || 'NOT SET');
    console.log('[AC] Tag ID:', AC_TAG_ID || 'NOT SET');

    const contactPayload = {
      contact: {
        email: data.email,
        firstName: firstName,
        lastName: lastName,
        ...(workshopId ? { fieldValues: [{ field: '20', value: workshopId }] } : {})
      }
    };

    try {
      // Step 1: Create or update contact
      const response = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
        method: 'POST',
        headers: {
          'Api-Token': AC_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AC] Contact sync error:', response.status, errorText);
      } else {
        const result = await response.json();
        const contactId = result.contact?.id;
        console.log('[AC] Contact synced successfully, contactId:', contactId);

        // Step 2: Subscribe contact to list with status=1 (ACTIVE)
        if (contactId && AC_LIST_ID) {
          console.log('[AC] Subscribing contact to list...');
          
          // Check if contactList record already exists
          const existingListResponse = await fetch(
            `${AC_API_URL}/api/3/contactLists?filters[contact]=${contactId}&filters[list]=${AC_LIST_ID}`,
            { headers: { 'Api-Token': AC_API_KEY } }
          );
          
          let contactListId = null;
          if (existingListResponse.ok) {
            const existingListResult = await existingListResponse.json();
            if (existingListResult.contactLists && existingListResult.contactLists.length > 0) {
              contactListId = existingListResult.contactLists[0].id;
              console.log('[AC] Existing contactList found, id:', contactListId);
            }
          }

          if (contactListId) {
            // Update existing subscription to Active
            const updatePayload = {
              contactList: {
                contact: String(contactId),
                list: String(AC_LIST_ID),
                status: 1 // 1 = Active
              }
            };
            console.log('[AC] PUT contactLists - contactId:', contactId, 'listId:', AC_LIST_ID, 'contactListId:', contactListId, 'payload keys:', Object.keys(updatePayload.contactList));
            
            const updateListResponse = await fetch(`${AC_API_URL}/api/3/contactLists/${contactListId}`, {
              method: 'PUT',
              headers: {
                'Api-Token': AC_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updatePayload)
            });
            
            if (updateListResponse.ok) {
              console.log('[AC] List subscription updated to Active');
            } else {
              const updateError = await updateListResponse.text();
              console.error('[AC] Failed to update list subscription:', updateListResponse.status, updateError);
            }
          } else {
            // Create new subscription
            const subscribeResponse = await fetch(`${AC_API_URL}/api/3/contactLists`, {
              method: 'POST',
              headers: {
                'Api-Token': AC_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contactList: {
                  contact: contactId,
                  list: AC_LIST_ID,
                  status: 1 // 1 = Active
                }
              })
            });
            
            if (subscribeResponse.ok) {
              const subscribeResult = await subscribeResponse.json();
              console.log('[AC] Contact subscribed to list, contactListId:', subscribeResult.contactList?.id);
            } else {
              const subscribeError = await subscribeResponse.text();
              console.error('[AC] Failed to subscribe to list:', subscribeResponse.status, subscribeError);
            }
          }
        } else if (!AC_LIST_ID) {
          console.warn('[AC] ACTIVECAMPAIGN_LIST_ID_KBM not set, skipping list subscription');
        }

        // Step 3: Add tag
        let tagId = AC_TAG_ID;
        
        // Fallback: search for tag by name if ID not provided
        if (!tagId) {
          console.log('[AC] Tag ID not set, searching by name...');
          const TAG_NAME = 'GW: Applied';
          
          const tagSearchResponse = await fetch(
            `${AC_API_URL}/api/3/tags?search=${encodeURIComponent(TAG_NAME)}`,
            { headers: { 'Api-Token': AC_API_KEY } }
          );
          
          if (tagSearchResponse.ok) {
            const tagSearchResult = await tagSearchResponse.json();
            const existingTag = tagSearchResult.tags?.find(t => t.tag === TAG_NAME);
            if (existingTag) {
              tagId = existingTag.id;
              console.log('[AC] Found tag by name, tagId:', tagId);
            }
          }

          if (!tagId) {
            const createTagResponse = await fetch(`${AC_API_URL}/api/3/tags`, {
              method: 'POST',
              headers: {
                'Api-Token': AC_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tag: {
                  tag: TAG_NAME,
                  tagType: 'contact',
                  description: 'Applied for Guided Workshop'
                }
              })
            });
            
            if (createTagResponse.ok) {
              const createTagResult = await createTagResponse.json();
              tagId = createTagResult.tag?.id;
              console.log('[AC] Created new tag, tagId:', tagId);
            }
          }
        }

        if (tagId && contactId) {
          console.log('[AC] Adding tag to contact...');
          const tagResponse = await fetch(`${AC_API_URL}/api/3/contactTags`, {
            method: 'POST',
            headers: {
              'Api-Token': AC_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contactTag: {
                contact: contactId,
                tag: tagId
              }
            })
          });
          
          if (tagResponse.ok) {
            console.log('[AC] Tag added successfully');
          } else {
            const tagError = await tagResponse.text();
            // Duplicate tag is OK
            if (tagResponse.status === 422) {
              console.log('[AC] Tag already exists on contact (expected)');
            } else {
              console.error('[AC] Failed to add tag:', tagResponse.status, tagError);
            }
          }
        }
        
        console.log('[AC] ActiveCampaign sync complete');
      }
    } catch (error) {
      console.error('[AC] Error submitting to ActiveCampaign:', error);
    }
  } else {
    console.log('[AC] ActiveCampaign not configured, skipping CRM integration');
  }

  const encodedFirstName = encodeURIComponent((firstName || '').trim());
  return {
    statusCode: 302,
    headers: { Location: `/guided-workshop/thanks${encodedFirstName ? `?name=${encodedFirstName}` : ''}` }
  };
};
