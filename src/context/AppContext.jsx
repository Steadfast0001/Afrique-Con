import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState(null);

  // --- DATABASE TABLES ---
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

  // Fetch all data from Supabase and perform auto-seeding if empty
  const loadAllData = async () => {
    try {
      // 1. Fetch Buses
      const { data: busData, error: busErr } = await supabase.from('buses').select('*');
      if (busErr) throw busErr;
      
      let currentBuses = busData || [];
      if (currentBuses.length === 0) {
        const initialBuses = [
          { name: 'Toyota Coaster', plate: 'CE-2434-H6', type: 'Gold', capacity: 70, status: 'Active', branch: 'Douala' },
          { name: 'Mercedes O500', plate: 'CE-5567-FH', type: 'Silver', capacity: 45, status: 'Maintenance', branch: 'Douala' },
          { name: 'Toyota Coaster', plate: 'CE-3347-CD', type: 'Silver', capacity: 51, status: 'Active', branch: 'Yaoundé' },
          { name: 'King Long Luxury', plate: 'CE-8832-BF', type: 'Gold', capacity: 28, status: 'Active', branch: 'Bamenda' },
          { name: 'Yutong Premium', plate: 'CE-9921-EG', type: 'Gold', capacity: 28, status: 'Active', branch: 'Douala' },
          { name: 'Toyota Coaster', plate: 'CE-4521-AH', type: 'Silver', capacity: 51, status: 'Active', branch: 'Yaoundé' }
        ];
        const { data: seededBuses, error: seedBusErr } = await supabase.from('buses').insert(initialBuses).select();
        if (!seedBusErr && seededBuses) {
          currentBuses = seededBuses;
        }
      }
      setBuses(currentBuses);

      // 2. Fetch Routes
      const { data: routeData, error: routeErr } = await supabase.from('routes').select('*');
      if (routeErr) throw routeErr;

      let currentRoutes = routeData || [];
      if (currentRoutes.length === 0) {
        const initialRoutes = [
          { origin: 'Bamenda', destination: 'Enugu', price: 20000, duration: '7h 30m', distance: '350 km', type: 'Cross-Border', passport_required: true },
          { origin: 'Yaoundé', destination: 'Douala', price: 5000, duration: '3h 30m', distance: '245 km', type: 'Inter-city', passport_required: false },
          { origin: 'Douala', destination: 'Bafoussam', price: 4500, duration: '3h 00m', distance: '195 km', type: 'Inter-city', passport_required: false },
          { origin: 'Yaoundé', destination: 'Bamenda', price: 7000, duration: '5h 00m', distance: '366 km', type: 'Inter-city', passport_required: false }
        ];
        const { data: seededRoutes, error: seedRouteErr } = await supabase.from('routes').insert(initialRoutes).select();
        if (!seedRouteErr && seededRoutes) {
          currentRoutes = seededRoutes;
        }
      }
      setRoutes(currentRoutes.map(r => ({
        ...r,
        passportRequired: r.passport_required
      })));

      // 3. Fetch Schedules
      const { data: schedData, error: schedErr } = await supabase.from('schedules').select('*');
      if (schedErr) throw schedErr;

      let currentSchedules = schedData || [];
      if (currentSchedules.length === 0 && currentRoutes.length > 0 && currentBuses.length > 0) {
        const r1 = currentRoutes.find(r => r.origin === 'Bamenda' && r.destination === 'Enugu')?.id;
        const r2 = currentRoutes.find(r => r.origin === 'Yaoundé' && r.destination === 'Douala')?.id;
        const r3 = currentRoutes.find(r => r.origin === 'Douala' && r.destination === 'Bafoussam')?.id;
        const r4 = currentRoutes.find(r => r.origin === 'Yaoundé' && r.destination === 'Bamenda')?.id;

        const b1 = currentBuses[0]?.id;
        const b3 = currentBuses[2]?.id;
        const b4 = currentBuses[3]?.id;
        const b5 = currentBuses[4]?.id;
        const b6 = currentBuses[5]?.id;

        const initialSchedules = [];
        if (r1 && b1) initialSchedules.push({ route_id: r1, bus_id: b1, departure_time: '03:00:00', departure_date: '2026-07-10', arrival_time: '10:30:00', status: 'Scheduled' });
        if (r2 && b3) initialSchedules.push({ route_id: r2, bus_id: b3, departure_time: '14:00:00', departure_date: '2026-07-03', arrival_time: '17:30:00', status: 'Scheduled' });
        if (r3 && b4) initialSchedules.push({ route_id: r3, bus_id: b4, departure_time: '11:15:00', departure_date: '2026-07-02', arrival_time: '14:15:00', status: 'Scheduled' });
        if (r1 && b5) initialSchedules.push({ route_id: r1, bus_id: b5, departure_time: '09:30:00', departure_date: '2026-07-02', arrival_time: '17:00:00', status: 'Scheduled' });
        if (r2 && b6) initialSchedules.push({ route_id: r2, bus_id: b6, departure_time: '08:00:00', departure_date: '2026-07-02', arrival_time: '11:30:00', status: 'Scheduled' });
        if (r4 && b4) initialSchedules.push({ route_id: r4, bus_id: b4, departure_time: '10:00:00', departure_date: '2026-07-02', arrival_time: '15:00:00', status: 'Scheduled' });

        if (initialSchedules.length > 0) {
          const { data: seededSchedules, error: seedSchedErr } = await supabase.from('schedules').insert(initialSchedules).select();
          if (!seedSchedErr && seededSchedules) {
            currentSchedules = seededSchedules;
          }
        }
      }
      setSchedules(currentSchedules.map(s => ({
        ...s,
        routeId: s.route_id,
        busId: s.bus_id,
        departureTime: s.departure_time.slice(0, 5),
        arrivalTime: s.arrival_time.slice(0, 5)
      })));

      // 4. Fetch Bookings
      const { data: bookData, error: bookErr } = await supabase.from('bookings').select('*');
      if (bookErr) throw bookErr;
      setBookings((bookData || []).map(b => ({
        ...b,
        scheduleId: b.schedule_id,
        userId: b.user_id,
        passengerName: b.passenger_name,
        passengerEmail: b.passenger_email,
        travelClass: b.travel_class,
        totalAmount: Number(b.total_amount),
        paymentMethod: b.payment_method,
        paymentStatus: b.payment_status,
        checkInStatus: b.check_in_status,
        passportNumber: b.passport_number,
        bookingDate: b.booking_date
      })));

      // 5. Fetch Support Tickets
      const { data: supportData, error: supportErr } = await supabase.from('support_tickets').select('*');
      if (supportErr) throw supportErr;
      setSupportTickets((supportData || []).map(t => ({
        ...t,
        userId: t.user_id,
        date: t.created_at.split('T')[0]
      })));

    } catch (err) {
      console.error("Error fetching Supabase database:", err);
    }
  };

  useEffect(() => {
    loadAllData();

    // Listen to Session Auth State Transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role
          });
        } else {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            role: session.user.user_metadata?.role || 'passenger'
          });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Auth Operations
  const registerUser = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'passenger'
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, user: data.user };
  };

  const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, user: data.user };
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Booking Operations
  const addBooking = async (bookingData) => {
    const bookingId = 'bk-' + Math.floor(100000 + Math.random() * 900000);
    const dbPayload = {
      id: bookingId,
      schedule_id: bookingData.scheduleId,
      user_id: currentUser ? currentUser.id : null,
      passenger_name: bookingData.passengerName,
      passenger_email: bookingData.passengerEmail,
      phone: bookingData.phone || '',
      seats: bookingData.seats,
      travel_class: bookingData.travelClass || 'Gold VIP+',
      total_amount: bookingData.totalAmount,
      payment_method: bookingData.paymentMethod,
      payment_status: bookingData.paymentStatus || 'Paid',
      check_in_status: bookingData.checkInStatus || 'Pending',
      passport_number: bookingData.passportNumber || null,
      passengers: bookingData.passengers || null
    };

    const { data, error } = await supabase.from('bookings').insert(dbPayload).select().single();
    if (error) {
      console.error("Error creating database booking:", error);
      throw error;
    }

    const formatted = {
      ...data,
      scheduleId: data.schedule_id,
      userId: data.user_id,
      passengerName: data.passenger_name,
      passengerEmail: data.passenger_email,
      travelClass: data.travel_class,
      totalAmount: Number(data.total_amount),
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      checkInStatus: data.check_in_status,
      passportNumber: data.passport_number,
      bookingDate: data.booking_date
    };

    setBookings(prev => [formatted, ...prev]);
    return formatted;
  };

  const cancelBooking = async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({ check_in_status: 'Cancelled', payment_status: 'Refunded' })
      .eq('id', bookingId);
    
    if (error) {
      console.error("Error cancelling booking:", error);
      return;
    }

    setBookings(prev => prev.map(bk => 
      bk.id === bookingId 
        ? { ...bk, checkInStatus: 'Cancelled', paymentStatus: 'Refunded' }
        : bk
    ));
  };

  const toggleCheckIn = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const nextStatus = booking.checkInStatus === 'Pending' ? 'Checked-In' : 'Pending';
    const { error } = await supabase
      .from('bookings')
      .update({ check_in_status: nextStatus })
      .eq('id', bookingId);
    
    if (error) {
      console.error("Error updating check-in status:", error);
      return;
    }

    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, checkInStatus: nextStatus } : b
    ));
  };

  // Fleet Operations (Bus CRUD)
  const addBus = async (busData) => {
    const { data, error } = await supabase.from('buses').insert({
      name: busData.name,
      plate: busData.plate,
      type: busData.type,
      capacity: busData.capacity || 70,
      status: 'Active',
      branch: busData.branch
    }).select().single();

    if (error) {
      console.error("Error adding bus:", error);
      throw error;
    }

    setBuses(prev => [...prev, data]);
    return data;
  };

  const updateBus = async (busId, updatedFields) => {
    const { error } = await supabase.from('buses').update(updatedFields).eq('id', busId);
    if (error) {
      console.error("Error updating bus:", error);
      throw error;
    }
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, ...updatedFields } : b));
  };

  const deleteBus = async (busId) => {
    const { error } = await supabase.from('buses').delete().eq('id', busId);
    if (error) {
      console.error("Error deleting bus:", error);
      throw error;
    }
    setBuses(prev => prev.filter(b => b.id !== busId));
  };

  // Route Operations
  const addRoute = async (routeData) => {
    const { data, error } = await supabase.from('routes').insert({
      origin: routeData.origin,
      destination: routeData.destination,
      price: routeData.price,
      duration: routeData.duration || '5h 00m',
      distance: routeData.distance || '300 km',
      type: routeData.type,
      passport_required: routeData.type === 'Cross-Border'
    }).select().single();

    if (error) {
      console.error("Error adding route:", error);
      throw error;
    }

    const formatted = { ...data, passportRequired: data.passport_required };
    setRoutes(prev => [...prev, formatted]);
    return formatted;
  };

  const updateRoute = async (routeId, updatedFields) => {
    const dbFields = { ...updatedFields };
    if (updatedFields.passportRequired !== undefined) {
      dbFields.passport_required = updatedFields.passportRequired;
      delete dbFields.passportRequired;
    }

    const { error } = await supabase.from('routes').update(dbFields).eq('id', routeId);
    if (error) {
      console.error("Error updating route:", error);
      throw error;
    }
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updatedFields } : r));
  };

  const deleteRoute = async (routeId) => {
    const { error } = await supabase.from('routes').delete().eq('id', routeId);
    if (error) {
      console.error("Error deleting route:", error);
      throw error;
    }
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  // Schedule Operations
  const addSchedule = async (scheduleData) => {
    const { data, error } = await supabase.from('schedules').insert({
      route_id: scheduleData.routeId,
      bus_id: scheduleData.busId,
      departure_time: scheduleData.departureTime + ':00',
      departure_date: scheduleData.departureDate,
      arrival_time: scheduleData.arrivalTime + ':00',
      status: 'Scheduled'
    }).select().single();

    if (error) {
      console.error("Error adding schedule:", error);
      throw error;
    }

    const formatted = {
      ...data,
      routeId: data.route_id,
      busId: data.bus_id,
      departureTime: data.departure_time.slice(0, 5),
      arrivalTime: data.arrival_time.slice(0, 5)
    };

    setSchedules(prev => [...prev, formatted]);
    return formatted;
  };

  const updateSchedule = async (scheduleId, updatedFields) => {
    const dbFields = { ...updatedFields };
    if (updatedFields.routeId !== undefined) {
      dbFields.route_id = updatedFields.routeId;
      delete dbFields.routeId;
    }
    if (updatedFields.busId !== undefined) {
      dbFields.bus_id = updatedFields.busId;
      delete dbFields.busId;
    }
    if (updatedFields.departureTime !== undefined) {
      dbFields.departure_time = updatedFields.departureTime + ':00';
      delete dbFields.departureTime;
    }
    if (updatedFields.arrivalTime !== undefined) {
      dbFields.arrival_time = updatedFields.arrivalTime + ':00';
      delete dbFields.arrivalTime;
    }
    if (updatedFields.departureDate !== undefined) {
      dbFields.departure_date = updatedFields.departureDate;
      delete dbFields.departureDate;
    }

    const { error } = await supabase.from('schedules').update(dbFields).eq('id', scheduleId);
    if (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
    setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, ...updatedFields } : s));
  };

  const deleteSchedule = async (scheduleId) => {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    if (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
  };

  // Support Operations
  const addSupportTicket = async (subject, message) => {
    const { data, error } = await supabase.from('support_tickets').insert({
      user_id: currentUser ? currentUser.id : null,
      subject,
      message,
      status: 'Open'
    }).select().single();

    if (error) {
      console.error("Error adding support ticket:", error);
      throw error;
    }

    const formatted = {
      ...data,
      userId: data.user_id,
      date: data.created_at.split('T')[0]
    };

    setSupportTickets(prev => [formatted, ...prev]);
    return formatted;
  };

  const updateTicketStatus = async (ticketId, status) => {
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    if (error) {
      console.error("Error updating support ticket status:", error);
      throw error;
    }
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      buses,
      routes,
      schedules,
      bookings,
      supportTickets,
      registerUser,
      loginUser,
      logoutUser,
      addBooking,
      toggleCheckIn,
      cancelBooking,
      addBus,
      updateBus,
      deleteBus,
      addRoute,
      updateRoute,
      deleteRoute,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      addSupportTicket,
      updateTicketStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
