import { createPendingWorkshop } from './utils/db.js';
import { sendEmail, formatAdminNotificationEmail, formatApplicantConfirmationEmail } from './utils/email.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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

  const nameParts = (data.fullName || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const applicantName = data.fullName?.trim() || '';
  const applicantEmail = data.email?.trim() || '';

  const applicationData = {
    fullName: data.fullName,
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
    console.log(`Created pending workshop: ${workshopId}`);
  } else {
    console.error('Failed to create pending workshop:', dbResult.reason);
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

  if (AC_API_URL && AC_API_KEY) {
    const startFromBeginningMap = { 'yes': 'Yes', 'no_in_progress': 'No - In Progress' };
    const comfortMap = { 'new': 'Brand new', 'some': 'Can do basics', 'ok': 'Fairly comfortable', 'confident': 'Confident' };
    const experienceMap = { 'beginner': 'Brand new', 'some': 'Few projects', 'comfortable': 'Comfortable', 'experienced': 'Experienced' };
    const patternMap = { 'haveOne': 'Have one', 'fewOptions': 'Few options', 'needGuidance': 'Need guidance', 'openToKBM': 'Open to KBM' };
    const yarnMap = { 'haveYarn': 'Have yarn', 'haveUnsure': 'Have but unsure', 'buyAfterApproval': 'Buy after approval', 'needRecs': 'Need recommendations' };
    const startWindowMap = { 'within2weeks': 'Within 2 weeks', '2to4weeks': '2-4 weeks', 'notSure': 'Not sure' };

    const contactPayload = {
      contact: {
        email: data.email,
        firstName: firstName,
        lastName: lastName,
        fieldValues: [
          { field: '11', value: data.projectDirection || '' },
          { field: '12', value: startFromBeginningMap[data.startFromBeginning] || data.startFromBeginning || '' },
          { field: '13', value: data.machineModel || '' },
          { field: '14', value: comfortMap[data.machineComfortLevel] || data.machineComfortLevel || '' },
          { field: '15', value: experienceMap[data.experienceLevel] || data.experienceLevel || '' },
          { field: '16', value: patternMap[data.patternStatus] || data.patternStatus || '' },
          { field: '17', value: data.patternReference || '' },
          { field: '18', value: yarnMap[data.yarnStatus] || data.yarnStatus || '' },
          { field: '19', value: startWindowMap[data.startWindow] || data.startWindow || '' },
          ...(workshopId ? [{ field: '20', value: workshopId }] : [])
        ]
      }
    };

    try {
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
        console.error('ActiveCampaign error:', response.status, errorText);
      } else {
        const result = await response.json();
        const contactId = result.contact?.id;
        console.log('Contact synced:', contactId);

        const TAG_NAME = 'GW: Applied';
        let tagId = null;

        const tagSearchResponse = await fetch(
          `${AC_API_URL}/api/3/tags?search=${encodeURIComponent(TAG_NAME)}`,
          { headers: { 'Api-Token': AC_API_KEY } }
        );
        
        if (tagSearchResponse.ok) {
          const tagSearchResult = await tagSearchResponse.json();
          const existingTag = tagSearchResult.tags?.find(t => t.tag === TAG_NAME);
          if (existingTag) {
            tagId = existingTag.id;
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
          }
        }

        if (tagId && contactId) {
          await fetch(`${AC_API_URL}/api/3/contactTags`, {
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
        }
      }
    } catch (error) {
      console.error('Error submitting to ActiveCampaign:', error);
    }
  } else {
    console.log('ActiveCampaign not configured, skipping CRM integration');
  }

  const encodedFirstName = encodeURIComponent((firstName || '').trim());
  return {
    statusCode: 302,
    headers: { Location: `/guided-workshop/thanks${encodedFirstName ? `?name=${encodedFirstName}` : ''}` }
  };
};
