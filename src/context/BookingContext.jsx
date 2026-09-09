import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useAuth } from './AuthContext';
import { enqueueOfflineMutation } from '../utils/offlineQueue';

const BookingContext = createContext();

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const parseSeats = (seatsField) => {
  if (Array.isArray(seatsField)) return seatsField.map(String);
  if (typeof seatsField === 'string') {
    try {
      const parsed = JSON.parse(seatsField);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return seatsField.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const parsePassengers = (pField) => {
  if (Array.isArray(pField)) return pField;
  if (typeof pField === 'string') {
    try {
      const parsed = JSON.parse(pField);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return null;
    }
  }
  return null;
};

export const LOCAL_BOOKINGS_KEY = 'transitflow_local_bookings';
export const LOCAL_SUPPORT_KEY = 'transitflow_local_support_tickets';

export const getLocalBookings = () => {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    if (!raw) {
      const initialDemo = [
        {
          id: 'bk-849201',
          scheduleId: 'sched-auto-route-dla-yde-2026-09-10',
          userId: null,
          passengerName: 'Brandy Jay',
          passengerEmail: 'brandy@example.com',
          phone: '237670001122',
          seats: ['1A', '1B'],
          travelClass: 'Gold VIP+',
          totalAmount: 18000,
          paymentMethod: 'Mobile Money',
          paymentStatus: 'Paid',
          checkInStatus: 'Confirmed',
          passportNumber: 'N10293847',
          passengers: [
            { seat: '1A', name: 'Brandy Jay', passport: 'N10293847' },
            { seat: '1B', name: 'Steady Beks', passport: 'N99283741' }
          ],
          bookingDate: new Date().toISOString()
        }
      ];
      localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(initialDemo));
      return initialDemo;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveLocalBookings = (list) => {
  try {
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(list));
  } catch {}
};

export const getLocalSupportTickets = () => {
  try {
    const raw = localStorage.getItem(LOCAL_SUPPORT_KEY);
    if (!raw) {
      const initialTickets = [
        {
          id: 'SUP-1048',
          customerName: 'Jean-Paul Nkomo',
          customerPhone: '237670001122',
          customerEmail: 'jp.nkomo@gmail.com',
          bookingRef: 'bk-849201',
          category: 'Seat Modification',
          priority: 'high',
          subject: 'Seat change request on Douala ➔ Yaoundé VIP bus',
          message: 'Hello, I booked seat 1A on tomorrow morning departure (07:30 AM) but would like to switch to a window seat with my colleague. Is that possible?',
          status: 'open',
          date: new Date().toISOString().split('T')[0],
          replies: []
        },
        {
          id: 'SUP-1049',
          customerName: 'Fatou Bello',
          customerPhone: '237699112233',
          customerEmail: 'fatou.bello@yahoo.fr',
          bookingRef: 'bk-953794',
          category: 'Refund & Billing',
          priority: 'medium',
          subject: 'Payment receipt confirmation & refund query',
          message: 'My MTN MoMo was debited twice during the online booking process for trip ref bk-953794. Please verify transaction ID #992817.',
          status: 'in-progress',
          date: new Date(Date.now() - 3600000 * 4).toISOString().split('T')[0],
          replies: [
            {
              id: 'rep-1',
              sender: 'agent',
              senderName: 'Customer Desk Agent',
              text: 'Hello Fatou, we are reviewing your MTN Mobile Money transaction logs with our finance gateway.',
              timestamp: '2 hours ago',
              channel: 'In-App'
            }
          ]
        },
        {
          id: 'SUP-1050',
          customerName: 'Emmanuel Okafor',
          customerPhone: '2348031234567',
          customerEmail: 'emmanuel.okafor@gmail.com',
          bookingRef: 'bk-774411',
          category: 'Border Documentation',
          priority: 'urgent',
          subject: 'Cross-border entry documents for Douala ➔ Ikom (Nigeria)',
          message: 'Do I need a yellow fever vaccination card along with my ECOWAS travel certificate for the Friday cross-border trip?',
          status: 'open',
          date: new Date(Date.now() - 3600000 * 8).toISOString().split('T')[0],
          replies: []
        }
      ];
      localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(initialTickets));
      return initialTickets;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveLocalSupportTickets = (list) => {
  try {
    localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(list));
  } catch {}
};

export function BookingProvider({ children }) {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState(() => getLocalBookings());
  const [supportTickets, setSupportTickets] = useState(() => getLocalSupportTickets());
  const [loading, setLoading] = useState(true);

  const updateBookingsState = (newBookingsOrFn) => {
    setBookings(prev => {
      const resolved = typeof newBookingsOrFn === 'function' ? newBookingsOrFn(prev) : newBookingsOrFn;
      saveLocalBookings(resolved);
      return resolved;
    });
  };

  const updateSupportState = (newTicketsOrFn) => {
    setSupportTickets(prev => {
      const resolved = typeof newTicketsOrFn === 'function' ? newTicketsOrFn(prev) : newTicketsOrFn;
      saveLocalSupportTickets(resolved);
      return resolved;
    });
  };

  const loadBookingData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Bookings
      const { data: bookData, error: bookErr } = await supabase.from('bookings').select('*');
      if (bookErr) throw bookErr;

      if (bookData && bookData.length > 0) {
        const mapped = bookData.map(b => ({
          ...b,
          id: String(b.id),
          scheduleId: String(b.schedule_id || b.scheduleId || ''),
          userId: b.user_id ? String(b.user_id) : null,
          passengerName: String(b.passenger_name || b.passengerName || ''),
          passengerEmail: String(b.passenger_email || b.passengerEmail || ''),
          phone: String(b.phone || ''),
          seats: parseSeats(b.seats),
          travelClass: String(b.travel_class || b.travelClass || 'Gold VIP+'),
          totalAmount: Number(b.total_amount ?? b.totalAmount) || 0,
          paymentMethod: String(b.payment_method || b.paymentMethod || 'Mobile Money'),
          paymentStatus: String(b.payment_status || b.paymentStatus || 'Paid'),
          checkInStatus: String(b.check_in_status || b.checkInStatus || 'Pending'),
          passportNumber: b.passport_number || b.passportNumber || null,
          passengers: parsePassengers(b.passengers),
          bookingDate: String(b.booking_date || b.bookingDate || new Date().toISOString())
        }));

        // Merge Supabase bookings with any existing local bookings
        updateBookingsState(prev => {
          const combined = [...mapped];
          prev.forEach(localB => {
            if (!combined.some(sb => sb.id === localB.id)) {
              combined.push(localB);
            }
          });
          return combined;
        });
      }

      // 2. Fetch Support Tickets
      const { data: supportData, error: supportErr } = await supabase.from('support_tickets').select('*');
      if (supportErr) throw supportErr;

      if (supportData && supportData.length > 0) {
        const mappedTickets = supportData.map(t => ({
          ...t,
          id: String(t.id),
          userId: t.user_id ? String(t.user_id) : null,
          customerName: String(t.customer_name || t.customerName || ''),
          customerPhone: String(t.customer_phone || t.customerPhone || ''),
          customerEmail: String(t.customer_email || t.customerEmail || ''),
          bookingRef: String(t.booking_ref || t.bookingRef || ''),
          category: String(t.category || 'General Inquiry'),
          priority: String(t.priority || 'medium'),
          subject: String(t.subject || ''),
          message: String(t.message || ''),
          status: String(t.status || 'open'),
          replies: Array.isArray(t.replies) ? t.replies : [],
          date: String((t.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0])
        }));

        updateSupportState(prev => {
          const combined = [...mappedTickets];
          prev.forEach(lt => {
            if (!combined.some(st => st.id === lt.id)) {
              combined.push(lt);
            }
          });
          return combined;
        });
      }

    } catch (err) {
      console.error('Error fetching Booking/Support data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingData();
  }, []);

  // Booking Operations
  const addBooking = async (bookingData) => {
    const bookingId = 'bk-' + Math.floor(100000 + Math.random() * 900000);
    const targetScheduleId = String(bookingData.scheduleId || '');
    const normalizedSeats = parseSeats(bookingData.seats);

    const dbPayload = {
      id: bookingId,
      schedule_id: isUUID(targetScheduleId) ? targetScheduleId : null,
      user_id: isUUID(currentUser?.id) ? currentUser.id : null,
      passenger_name: String(bookingData.passengerName || ''),
      passenger_email: String(bookingData.passengerEmail || ''),
      phone: String(bookingData.phone || ''),
      seats: normalizedSeats,
      travel_class: String(bookingData.travelClass || 'Gold VIP+'),
      total_amount: Number(bookingData.totalAmount) || 0,
      payment_method: String(bookingData.paymentMethod || 'Mobile Money'),
      payment_status: String(bookingData.paymentStatus || 'Paid'),
      check_in_status: String(bookingData.checkInStatus || 'Pending'),
      passport_number: bookingData.passportNumber || null,
      passengers: bookingData.passengers || null
    };

    if (isSupabaseConfigured && dbPayload.schedule_id) {
      try {
        const { data, error } = await supabase.from('bookings').insert(dbPayload).select().single();
        if (error) {
          if (error.message && (error.message.includes('SEAT_ALREADY_BOOKED') || error.message.includes('already reserved'))) {
            throw new Error(error.message);
          }
          console.warn('Supabase addBooking warning, queueing offline mutation:', error.message);
          enqueueOfflineMutation({ type: 'INSERT', table: 'bookings', payload: dbPayload });
        } else if (data) {
          const formatted = {
            ...data,
            id: String(data.id),
            scheduleId: String(data.schedule_id),
            userId: data.user_id ? String(data.user_id) : null,
            passengerName: String(data.passenger_name),
            passengerEmail: String(data.passenger_email),
            phone: String(data.phone || ''),
            seats: parseSeats(data.seats),
            travelClass: String(data.travel_class),
            totalAmount: Number(data.total_amount),
            paymentMethod: String(data.payment_method),
            paymentStatus: String(data.payment_status),
            checkInStatus: String(data.check_in_status),
            passportNumber: data.passport_number || null,
            passengers: parsePassengers(data.passengers),
            bookingDate: String(data.booking_date)
          };
          updateBookingsState(prev => [formatted, ...prev]);
          return formatted;
        }
      } catch (err) {
        if (err.message && (err.message.includes('SEAT_ALREADY_BOOKED') || err.message.includes('already reserved'))) {
          throw err;
        }
        console.warn('Supabase addBooking catch, queueing mutation:', err);
        enqueueOfflineMutation({ type: 'INSERT', table: 'bookings', payload: dbPayload });
      }
    }

    const localFormatted = {
      id: bookingId,
      scheduleId: targetScheduleId,
      userId: currentUser ? String(currentUser.id) : null,
      passengerName: String(bookingData.passengerName || ''),
      passengerEmail: String(bookingData.passengerEmail || ''),
      phone: String(bookingData.phone || ''),
      seats: normalizedSeats,
      travelClass: String(bookingData.travelClass || 'Gold VIP+'),
      totalAmount: Number(bookingData.totalAmount) || 0,
      paymentMethod: String(bookingData.paymentMethod || 'Mobile Money'),
      paymentStatus: String(bookingData.paymentStatus || 'Paid'),
      checkInStatus: String(bookingData.checkInStatus || 'Pending'),
      passportNumber: bookingData.passportNumber || null,
      passengers: parsePassengers(bookingData.passengers),
      bookingDate: new Date().toISOString()
    };

    updateBookingsState(prev => [localFormatted, ...prev]);
    return localFormatted;
  };

  const updateBooking = async (bookingId, updates) => {
    if (!bookingId) return;

    const dbPayload = {};
    if (updates.checkInStatus !== undefined) dbPayload.check_in_status = updates.checkInStatus;
    if (updates.paymentStatus !== undefined) dbPayload.payment_status = updates.paymentStatus;
    if (updates.travelClass !== undefined) dbPayload.travel_class = updates.travelClass;
    if (updates.passengerName !== undefined) dbPayload.passenger_name = updates.passengerName;
    if (updates.passengerEmail !== undefined) dbPayload.passenger_email = updates.passengerEmail;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone;
    if (updates.seats !== undefined) dbPayload.seats = parseSeats(updates.seats);
    if (updates.passportNumber !== undefined) dbPayload.passport_number = updates.passportNumber;

    if (isSupabaseConfigured && Object.keys(dbPayload).length > 0) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update(dbPayload)
          .eq('id', bookingId);
        if (error) {
          console.warn('Supabase updateBooking warning, queueing offline mutation:', error.message);
          enqueueOfflineMutation({
            type: 'UPDATE',
            table: 'bookings',
            payload: dbPayload,
            match: { id: bookingId }
          });
        }
      } catch (err) {
        console.warn('Supabase updateBooking catch, queueing mutation:', err);
        enqueueOfflineMutation({
          type: 'UPDATE',
          table: 'bookings',
          payload: dbPayload,
          match: { id: bookingId }
        });
      }
    }

    updateBookingsState(prev => prev.map(bk =>
      bk.id === bookingId ? { ...bk, ...updates } : bk
    ));
    return { id: bookingId, ...updates };
  };

  const deleteBooking = async (bookingId) => {
    if (!bookingId) return;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('bookings').delete().eq('id', bookingId);
      } catch (err) {
        enqueueOfflineMutation({
          type: 'DELETE',
          table: 'bookings',
          match: { id: bookingId }
        });
      }
    }

    updateBookingsState(prev => prev.filter(bk => bk.id !== bookingId));
  };

  const deleteBookings = async (bookingIds = []) => {
    if (!bookingIds || bookingIds.length === 0) return;
    const idSet = new Set(bookingIds.map(String));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('bookings').delete().in('id', Array.from(idSet));
      } catch (err) {
        bookingIds.forEach(id => {
          enqueueOfflineMutation({
            type: 'DELETE',
            table: 'bookings',
            match: { id }
          });
        });
      }
    }

    updateBookingsState(prev => prev.filter(bk => !idSet.has(String(bk.id))));
  };

  const cancelBooking = async (bookingId) => {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('bookings')
          .update({ check_in_status: 'Cancelled', payment_status: 'Refunded' })
          .eq('id', bookingId);
      } catch (err) {
        enqueueOfflineMutation({
          type: 'UPDATE',
          table: 'bookings',
          payload: { check_in_status: 'Cancelled', payment_status: 'Refunded' },
          match: { id: bookingId }
        });
      }
    }

    updateBookingsState(prev => prev.map(bk =>
      bk.id === bookingId
        ? { ...bk, checkInStatus: 'Cancelled', paymentStatus: 'Refunded' }
        : bk
    ));
  };

  const toggleCheckIn = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const nextStatus = booking.checkInStatus === 'Pending' ? 'Checked-In' : 'Pending';

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('bookings')
          .update({ check_in_status: nextStatus })
          .eq('id', bookingId);
      } catch (err) {
        enqueueOfflineMutation({
          type: 'UPDATE',
          table: 'bookings',
          payload: { check_in_status: nextStatus },
          match: { id: bookingId }
        });
      }
    }

    updateBookingsState(prev => prev.map(b =>
      b.id === bookingId ? { ...b, checkInStatus: nextStatus } : b
    ));
  };

  // Support Operations
  const addSupportTicket = async (ticketData) => {
    const payload = {
      customer_name: ticketData.customerName || currentUser?.name || 'Customer',
      customer_phone: ticketData.customerPhone || '',
      customer_email: ticketData.customerEmail || currentUser?.email || '',
      booking_ref: ticketData.bookingRef || null,
      category: ticketData.category || 'General',
      priority: ticketData.priority || 'medium',
      subject: ticketData.subject || '',
      message: ticketData.message || '',
      status: 'open'
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('support_tickets').insert(payload).select().single();
        if (!error && data) {
          const formatted = {
            ...data,
            id: String(data.id),
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email,
            bookingRef: data.booking_ref,
            category: data.category,
            priority: data.priority,
            subject: data.subject,
            message: data.message,
            status: data.status,
            replies: [],
            date: data.created_at.split('T')[0]
          };
          updateSupportState(prev => [formatted, ...prev]);
          return formatted;
        }
      } catch (err) {
        enqueueOfflineMutation({ type: 'INSERT', table: 'support_tickets', payload });
      }
    }

    const localTicket = {
      id: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: payload.customer_name,
      customerPhone: payload.customer_phone,
      customerEmail: payload.customer_email,
      bookingRef: payload.booking_ref,
      category: payload.category,
      priority: payload.priority,
      subject: payload.subject,
      message: payload.message,
      status: 'open',
      replies: [],
      date: new Date().toISOString().split('T')[0]
    };
    updateSupportState(prev => [localTicket, ...prev]);
    return localTicket;
  };

  const updateTicketStatus = async (ticketId, status) => {
    if (isSupabaseConfigured && isUUID(ticketId)) {
      try {
        const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
        if (error) throw error;
      } catch (err) {
        console.warn('Update ticket error, queueing offline mutation:', err);
        enqueueOfflineMutation({ type: 'UPDATE', table: 'support_tickets', payload: { status }, match: { id: ticketId } });
      }
    }
    updateSupportState(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
  };

  const replySupportTicket = async (ticketId, replyText, channel = 'In-App') => {
    const newReply = {
      id: `rep-${Date.now()}`,
      sender: 'agent',
      senderName: currentUser?.name || 'Support Representative',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel
    };

    updateSupportState(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updatedReplies = [...(t.replies || []), newReply];
        return {
          ...t,
          status: t.status === 'open' ? 'in-progress' : t.status,
          replies: updatedReplies
        };
      }
      return t;
    }));

    if (isSupabaseConfigured && isUUID(ticketId)) {
      try {
        const current = supportTickets.find(t => t.id === ticketId);
        const updatedReplies = [...(current?.replies || []), newReply];
        await supabase.from('support_tickets').update({
          replies: updatedReplies,
          status: current?.status === 'open' ? 'in-progress' : current?.status
        }).eq('id', ticketId);
      } catch (err) {
        console.warn('Supabase reply error:', err);
      }
    }

    return newReply;
  };

  const deleteSupportTicket = async (ticketId) => {
    if (isSupabaseConfigured && isUUID(ticketId)) {
      try {
        await supabase.from('support_tickets').delete().eq('id', ticketId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'DELETE', table: 'support_tickets', match: { id: ticketId } });
      }
    }
    updateSupportState(prev => prev.filter(t => t.id !== ticketId));
  };

  const deleteSupportTickets = async (ticketIds = []) => {
    if (!ticketIds.length) return;
    const idSet = new Set(ticketIds.map(String));
    if (isSupabaseConfigured) {
      const validUuids = ticketIds.filter(isUUID);
      if (validUuids.length > 0) {
        try {
          await supabase.from('support_tickets').delete().in('id', validUuids);
        } catch (err) {
          validUuids.forEach(id => {
            enqueueOfflineMutation({ type: 'DELETE', table: 'support_tickets', match: { id } });
          });
        }
      }
    }
    updateSupportState(prev => prev.filter(t => !idSet.has(String(t.id))));
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        supportTickets,
        loading,
        addBooking,
        updateBooking,
        deleteBooking,
        deleteBookings,
        cancelBooking,
        toggleCheckIn,
        addSupportTicket,
        updateTicketStatus,
        replySupportTicket,
        deleteSupportTicket,
        deleteSupportTickets,
        loadBookingData
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
