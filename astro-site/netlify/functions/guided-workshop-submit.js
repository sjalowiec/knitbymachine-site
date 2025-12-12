exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL;
  const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

  if (!AC_API_URL || !AC_API_KEY) {
    console.error('Missing ActiveCampaign credentials');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Honeypot check
  if (data.company && data.company.trim() !== '') {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  // Split full name into first/last
  const nameParts = (data.fullName || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Map form values to ActiveCampaign dropdown option labels
  const startingFreshMap = { 'yes': 'Yes', 'no': 'No' };
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
        { field: '12', value: startingFreshMap[data.startingFresh] || data.startingFresh || '' },
        { field: '13', value: data.machineModel || '' },
        { field: '14', value: comfortMap[data.machineComfortLevel] || data.machineComfortLevel || '' },
        { field: '15', value: experienceMap[data.experienceLevel] || data.experienceLevel || '' },
        { field: '16', value: patternMap[data.patternStatus] || data.patternStatus || '' },
        { field: '17', value: data.patternReference || '' },
        { field: '18', value: yarnMap[data.yarnStatus] || data.yarnStatus || '' },
        { field: '19', value: startWindowMap[data.startWindow] || data.startWindow || '' }
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
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to submit to ActiveCampaign' }) 
      };
    }

    const result = await response.json();
    console.log('Contact synced:', result.contact?.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, contactId: result.contact?.id })
    };
  } catch (error) {
    console.error('Error submitting to ActiveCampaign:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Server error' }) 
    };
  }
};
