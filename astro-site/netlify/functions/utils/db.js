import { neon } from '@neondatabase/serverless';

const MAX_RETRIES = 5;

// Default internal notes template for new guided workshop applications
const INTERNAL_NOTES_TEMPLATE = `APPLICATION SUMMARY
- Project direction:
- Yarn status:
- Starting from scratch or in progress:

CLARIFICATION (if needed)
[ ] Clarification email sent on:
Questions asked:
- 
- 
- 

APPLICANT RESPONSE
[ ] Response received on:
- 

DECISION
[ ] Approved
[ ] Not a fit
Decision date:
Notes:`;

function generateWorkshopId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'gw-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateAccessToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createPendingWorkshop({ applicantName, applicantEmail, applicationData }) {
  const { DATABASE_URL } = process.env;
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not configured');
    return { success: false, reason: 'database_not_configured' };
  }

  const sql = neon(DATABASE_URL);
  
  let workshopId;
  let accessToken;
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    workshopId = generateWorkshopId();
    accessToken = generateAccessToken();
    attempts++;
    
    try {
      const result = await sql`
        INSERT INTO guided_workshops (
          workshop_id,
          slug,
          status,
          applicant_name,
          applicant_email,
          application_data,
          internal_notes,
          access_token,
          is_draft,
          pending_publish,
          created_at,
          updated_at
        ) VALUES (
          ${workshopId},
          ${workshopId},
          'pending',
          ${applicantName},
          ${applicantEmail},
          ${JSON.stringify(applicationData)},
          ${INTERNAL_NOTES_TEMPLATE},
          ${accessToken},
          true,
          false,
          NOW(),
          NOW()
        )
        RETURNING id, workshop_id
      `;
      
      console.log('Created pending workshop:', workshopId);
      return { 
        success: true, 
        workshopId: result[0].workshop_id,
        id: result[0].id 
      };
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'guided_workshops_workshop_id_unique') {
        console.log(`Workshop ID collision on attempt ${attempts}, retrying...`);
        continue;
      }
      console.error('Database error creating pending workshop:', error);
      return { success: false, reason: 'database_error', error: error.message };
    }
  }
  
  console.error(`Failed to generate unique workshop ID after ${MAX_RETRIES} attempts`);
  return { success: false, reason: 'id_generation_failed' };
}
