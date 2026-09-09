import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { 
      amount, 
      currency = 'XAF', 
      from, 
      description, 
      external_reference,
      schedule_id,
      seats,
      seat_count,
      travel_class 
    } = req.body;

    // Validate phone number
    if (!from) {
      return res.status(400).json({ success: false, message: 'Missing required parameter: from (phone number).' });
    }
    const cleanPhone = String(from).replace(/[^0-9]/g, '');
    const normalizedPhone = cleanPhone.startsWith('237') ? cleanPhone : '237' + cleanPhone;

    if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('2376')) {
      return res.status(400).json({ success: false, message: 'Invalid Cameroonian MTN/Orange phone number.' });
    }

    let finalAmount = amount;

    // Server-Side Price Verification against Supabase database
    const seatQty = Array.isArray(seats) ? seats.length : (Number(seat_count) || 1);
    if (schedule_id && supabase) {
      const { data: scheduleData, error: schedErr } = await supabase
        .from('schedules')
        .select('id, route_id, routes (price)')
        .eq('id', schedule_id)
        .single();

      if (!schedErr && scheduleData?.routes?.price) {
        const baseRoutePrice = Number(scheduleData.routes.price);
        const classMultiplier = (travel_class === 'Gold VIP+' || travel_class === 'Gold') ? 1.5 : 1.0;
        const verifiedTotal = Math.round(baseRoutePrice * seatQty * classMultiplier);

        if (process.env.CAMPAY_ENV === 'prod') {
          // In production, strictly enforce verified database calculation
          finalAmount = String(verifiedTotal);
        } else if (!amount || Number(amount) <= 0) {
          finalAmount = String(verifiedTotal);
        }
      }
    }

    if (!finalAmount || Number(finalAmount) <= 0) {
      finalAmount = process.env.CAMPAY_ENV === 'prod' ? '1000' : '25';
    }

    const token = await getCampayToken();
    const baseUrl = process.env.CAMPAY_ENV === 'prod' ? 'https://www.campay.net/api' : 'https://demo.campay.net/api';

    const response = await fetch(`${baseUrl}/collect/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: String(finalAmount),
        currency: currency || 'XAF',
        from: normalizedPhone,
        description: description || `Afrique Con Booking ${schedule_id || ''}`.trim(),
        external_reference: external_reference || ('tf-' + Date.now())
      })
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


