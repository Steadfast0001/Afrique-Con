let cachedToken = null;
let tokenExpiresAt = 0;

async function getCampayToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }
  const username = process.env.CAMPAY_USERNAME;
  const password = process.env.CAMPAY_PASSWORD;

  if (!username || !password) {
    throw new Error('CAMPAY_USERNAME and CAMPAY_PASSWORD environment variables must be configured on the server.');
  }

  const baseUrl = process.env.CAMPAY_ENV === 'prod' ? 'https://www.campay.net/api' : 'https://demo.campay.net/api';

  const res = await fetch(`${baseUrl}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Campay authentication failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiresAt = now + ((data.expires_in || 3600) * 1000);
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get ref from query parameter
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({ message: 'Missing transaction reference parameter (ref)' });
  }

  try {
    const token = await getCampayToken();
    const baseUrl = process.env.CAMPAY_ENV === 'prod' ? 'https://www.campay.net/api' : 'https://demo.campay.net/api';

    const response = await fetch(`${baseUrl}/transaction/${ref}/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return res.status(response.status).send(responseText);
    }

    return res.status(response.status).json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}


