import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { bookingId, phone, channel = 'whatsapp' } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    let booking = null;
    let schedule = null;
    let route = null;

    if (supabase) {
      const { data: bData } = await supabase
        .from('bookings')
        .select(`
          id, passenger_name, phone, seats, travel_class, total_amount, payment_status,
          schedules (
            id, departure_time, departure_date,
            routes (origin, destination, duration)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bData) {
        booking = bData;
        schedule = bData.schedules;
        route = bData.schedules?.routes;
      }
    }

    const passengerName = booking?.passenger_name || 'Valued Passenger';
    const origin = route?.origin || 'Departure Hub';
    const destination = route?.destination || 'Arrival Hub';
    const departureDate = schedule?.departure_date || 'Scheduled Date';
    const departureTime = schedule?.departure_time || 'Scheduled Time';
    const seats = Array.isArray(booking?.seats) ? booking.seats.join(', ') : (booking?.seats || 'Standard');
    const totalAmount = booking?.total_amount ? `${Number(booking.totalAmount).toLocaleString()} FCFA` : 'Paid';

    // Construct high-converting localized notification message
    const textMessage = `🚌 *AFRIQUE CON / TRANSITFLOW E-TICKET CONFIRMATION*\n\n` +
      `Hello *${passengerName}*,\n` +
      `Your booking *${bookingId}* is confirmed & active!\n\n` +
      `📍 *Route:* ${origin} ➔ ${destination}\n` +
      `📅 *Date:* ${departureDate}\n` +
      `⏰ *Time:* ${departureTime} (Gate Platform 3)\n` +
      `💺 *Seat(s):* ${seats}\n` +
      `💳 *Status:* ${booking?.payment_status || 'Paid'} (${totalAmount})\n\n` +
      `🎟️ *View / Print Your Boarding Pass:*\n` +
      `https://afriquecon.com/ticket/${bookingId}\n\n` +
      `_Please arrive at the terminalAkwa / Quartier Fouda 30 mins before departure. Safe Travels!_`;

    const cleanPhone = (phone || booking?.phone || '').replace(/[^0-9]/g, '');
    const normalizedPhone = cleanPhone.startsWith('237') ? cleanPhone : cleanPhone.startsWith('234') ? cleanPhone : ('237' + cleanPhone);

    const waLink = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(textMessage)}`;

    return res.status(200).json({
      success: true,
      channel,
      phone: normalizedPhone,
      message: textMessage,
      whatsapp_url: waLink
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
