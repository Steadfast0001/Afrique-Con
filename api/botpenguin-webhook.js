import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to generate unique booking reference
function generateBookingRef() {
  const chars = '0123456789';
  let ref = 'TH-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
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

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase credentials not configured in environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
    });
  }

  try {
    const payload = req.method === 'GET' ? req.query : (req.body || {});
    const action = payload.action || 'create_booking';

    // 1. ACTION: CHECK AVAILABLE ROUTES / SCHEDULES
    if (action === 'get_schedules' || action === 'search') {
      const { origin, destination, date } = payload;
      let query = supabase
        .from('schedules')
        .select(`
          id,
          departure_time,
          departure_date,
          arrival_time,
          status,
          routes!inner (origin, destination, price, duration, type, passport_required),
          buses (name, plate, type, capacity)
        `)
        .eq('status', 'Scheduled');

      if (origin) {
        query = query.ilike('routes.origin', `%${origin}%`);
      }
      if (destination) {
        query = query.ilike('routes.destination', `%${destination}%`);
      }
      if (date) {
        query = query.eq('departure_date', date);
      }

      const { data, error } = await query.limit(5);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        count: data?.length || 0,
        schedules: (data || []).map((s) => ({
          schedule_id: s.id,
          route: `${s.routes?.origin} -> ${s.routes?.destination}`,
          date: s.departure_date,
          time: s.departure_time,
          price: `${s.routes?.price} FCFA`,
          bus_type: s.buses?.type || 'Standard',
          passport_required: s.routes?.passport_required
        }))
      });
    }

    // 2. ACTION: CHECK BOOKING STATUS
    if (action === 'check_status' || action === 'lookup_booking') {
      const bookingId = (payload.booking_id || payload.ref || payload.ticket_id || '').trim();

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID is required'
        });
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          passenger_name,
          passenger_email,
          phone,
          seats,
          travel_class,
          total_amount,
          payment_status,
          check_in_status,
          booking_date,
          schedules (
            departure_time,
            departure_date,
            routes (origin, destination, duration)
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message: `Booking ${bookingId} not found. Please verify the booking reference number.`
        });
      }

      return res.status(200).json({
        success: true,
        booking_id: data.id,
        passenger_name: data.passenger_name,
        route: `${data.schedules?.routes?.origin} -> ${data.schedules?.routes?.destination}`,
        departure_date: data.schedules?.departure_date,
        departure_time: data.schedules?.departure_time,
        seats: data.seats?.join(', '),
        travel_class: data.travel_class,
        total_amount: `${data.total_amount} FCFA`,
        payment_status: data.payment_status,
        check_in_status: data.check_in_status,
        ticket_url: `https://transitflow.vercel.app/ticket/${data.id}`
      });
    }

    // 3. ACTION: CREATE NEW BOOKING (Default)
    if (action === 'create_booking') {
      const {
        origin,
        destination,
        departure_date,
        schedule_id,
        passenger_name,
        phone,
        email = '',
        travel_class = 'Silver',
        passport_number = null,
        seat_count = 1
      } = payload;

      if (!passenger_name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Passenger name and phone number are required.'
        });
      }

      let targetScheduleId = schedule_id;
      let routePrice = 5000;
      let departureTime = '08:00';
      let originName = origin || 'Douala';
      let destName = destination || 'Yaoundé';

      // If no schedule_id is given, find a matching scheduled trip
      if (!targetScheduleId) {
        let scheduleQuery = supabase
          .from('schedules')
          .select(`
            id,
            departure_time,
            departure_date,
            routes!inner (id, origin, destination, price)
          `)
          .eq('status', 'Scheduled');

        if (origin) scheduleQuery = scheduleQuery.ilike('routes.origin', `%${origin}%`);
        if (destination) scheduleQuery = scheduleQuery.ilike('routes.destination', `%${destination}%`);
        if (departure_date) scheduleQuery = scheduleQuery.eq('departure_date', departure_date);

        const { data: matchedSchedules } = await scheduleQuery.limit(1);

        if (matchedSchedules && matchedSchedules.length > 0) {
          const match = matchedSchedules[0];
          targetScheduleId = match.id;
          departureTime = match.departure_time;
          routePrice = match.routes?.price || 5000;
          originName = match.routes?.origin || originName;
          destName = match.routes?.destination || destName;
        } else {
          // Fallback to any existing schedule
          const { data: anySchedule } = await supabase.from('schedules').select('id, routes(price, origin, destination)').limit(1);
          if (anySchedule && anySchedule.length > 0) {
            targetScheduleId = anySchedule[0].id;
            routePrice = anySchedule[0].routes?.price || 5000;
            originName = anySchedule[0].routes?.origin || originName;
            destName = anySchedule[0].routes?.destination || destName;
          }
        }
      }

      const multiplier = travel_class.includes('Gold') || travel_class.includes('VIP') ? 1.5 : 1;
      const totalAmount = Number(routePrice) * multiplier * Number(seat_count || 1);
      const bookingId = generateBookingRef();
      const randomSeat = `A${Math.floor(Math.random() * 20) + 1}`;

      const newBooking = {
        id: bookingId,
        schedule_id: targetScheduleId,
        passenger_name: passenger_name.trim(),
        passenger_email: email.trim() || `${phone.replace(/\D/g, '')}@whatsapp.transitflow.com`,
        phone: phone.trim(),
        seats: [randomSeat],
        travel_class: travel_class.includes('Gold') ? 'Gold VIP+' : 'Silver',
        total_amount: totalAmount,
        payment_method: 'WhatsApp / Mobile Money',
        payment_status: 'Pending',
        check_in_status: 'Pending',
        passport_number: passport_number || null,
        passengers: [{ seat: randomSeat, name: passenger_name.trim(), passport: passport_number || '' }]
      };

      const { data: inserted, error: insertError } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select()
        .single();

      if (insertError) {
        console.error('Insert Booking Error:', insertError);
        throw insertError;
      }

      return res.status(200).json({
        success: true,
        booking_id: bookingId,
        passenger_name: passenger_name,
        route: `${originName} -> ${destName}`,
        departure_date: departure_date || 'Upcoming',
        departure_time: departureTime,
        seat: randomSeat,
        travel_class: newBooking.travel_class,
        total_amount: `${totalAmount} FCFA`,
        payment_status: 'Pending',
        ticket_url: `https://transitflow.vercel.app/ticket/${bookingId}`,
        message: `Booking created successfully! Reference: ${bookingId}. Total: ${totalAmount} FCFA.`
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action specified.' });
  } catch (error) {
    console.error('BotPenguin Webhook Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
