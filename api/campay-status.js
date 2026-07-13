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
    const response = await fetch(`https://demo.campay.net/api/transaction/${ref}/`, {
      headers: {
        'Authorization': 'Token 0c6d7a67bad9254d8c2c2cd34d2e8d669ce9618f',
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
