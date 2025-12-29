/**
 * pp-unlock.js
 * Netlify function to handle Practice Project and Community email unlock
 * 
 * Accepts POST with { email, firstName, projectId }
 * Upserts contact in ActiveCampaign and applies the appropriate tag
 * 
 * Required env vars:
 * - ACTIVECAMPAIGN_API_URL: ActiveCampaign API base URL (e.g., https://yourname.api-us1.com)
 * - ACTIVECAMPAIGN_API_KEY: ActiveCampaign API key
 * - AC_TAG_ID_PP_CASTON: Tag ID for PP-caston tag
 * - AC_TAG_ID_COMMUNITY: Tag ID for "Access – Community" tag
 */

const TAG_MAP = {
  'pp-caston': 'AC_TAG_ID_PP_CASTON',
  'community': 'AC_TAG_ID_COMMUNITY',
};

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Method Not Allowed' }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Invalid JSON body' }),
    };
  }

  const { email, firstName, projectId } = data;

  if (!email || typeof email !== 'string') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Email is required' }),
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Invalid email format' }),
    };
  }

  if (!projectId || typeof projectId !== 'string') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Project ID is required' }),
    };
  }

  const tagEnvKey = TAG_MAP[projectId];
  if (!tagEnvKey) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: `Unknown project ID: ${projectId}` }),
    };
  }

  const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL || process.env.AC_API_URL;
  const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
  const AC_TAG_ID = process.env[tagEnvKey];

  if (!AC_API_URL || !AC_API_KEY) {
    console.error('[PP-UNLOCK] Missing AC_API_URL or ACTIVECAMPAIGN_API_KEY');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Unable to process request. Please try again later.' }),
    };
  }

  if (!AC_TAG_ID) {
    console.error(`[PP-UNLOCK] Missing env var: ${tagEnvKey}. Please set this in Netlify environment variables.`);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'Unable to process request. Please try again later.' }),
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedFirstName = firstName ? firstName.trim() : '';

  try {
    const contactPayload = { email: trimmedEmail };
    if (trimmedFirstName) {
      contactPayload.firstName = trimmedFirstName;
    }

    const syncResponse = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact: contactPayload,
      }),
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      console.error('[PP-UNLOCK] AC contact sync failed:', syncResponse.status, errorText);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, message: 'Failed to sync contact with ActiveCampaign' }),
      };
    }

    const syncData = await syncResponse.json();
    const contactId = syncData.contact?.id;

    if (!contactId) {
      console.error('[PP-UNLOCK] No contact ID returned from AC sync');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, message: 'Failed to get contact ID from ActiveCampaign' }),
      };
    }

    const tagResponse = await fetch(`${AC_API_URL}/api/3/contactTags`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactTag: {
          contact: contactId,
          tag: AC_TAG_ID,
        },
      }),
    });

    if (!tagResponse.ok) {
      const tagStatus = tagResponse.status;
      if (tagStatus === 422) {
        console.log('[PP-UNLOCK] Tag already applied (422), treating as success');
      } else {
        const errorText = await tagResponse.text();
        console.error('[PP-UNLOCK] AC tag application failed:', tagStatus, errorText);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ ok: false, message: 'Failed to apply tag in ActiveCampaign' }),
        };
      }
    }

    console.log(`[PP-UNLOCK] Success: ${trimmedEmail} tagged with ${projectId}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };

  } catch (error) {
    console.error('[PP-UNLOCK] Unexpected error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, message: 'An unexpected error occurred' }),
    };
  }
};
