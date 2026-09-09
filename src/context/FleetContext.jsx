import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { enqueueOfflineMutation } from '../utils/offlineQueue';

const FleetContext = createContext();

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const isNigeriaDestination = (locationName = '') => {
  if (!locationName) return false;
  const lower = locationName.toLowerCase();
  return lower.includes('nigeria') || lower.includes('ikom') || lower.includes('calabar') || 
         lower.includes('lagos') || lower.includes('enugu') || lower.includes('onitsha');
};

export const isTuesdayOrFriday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return day === 2 || day === 5;
};

const AFRIQUE_CON_DEFAULT_ROUTES = [
  // Domestic Cameroon Terminals
  { id: 'route-dla-yde', origin: 'Douala (Akwa)', destination: 'Yaoundé (Quartier Fouda)', price: 6000, duration: '3h 30m', distance: '245 km', type: 'Inter-city', passport_required: false },
  { id: 'route-yde-dla', origin: 'Yaoundé (Quartier Fouda)', destination: 'Douala (Akwa)', price: 6000, duration: '3h 30m', distance: '245 km', type: 'Inter-city', passport_required: false },
  { id: 'route-dla-buea', origin: 'Douala (Bonabéri)', destination: 'Buea (Mile 17)', price: 3000, duration: '1h 15m', distance: '70 km', type: 'Inter-city', passport_required: false },
  { id: 'route-buea-dla', origin: 'Buea (Mile 17)', destination: 'Douala (Bonabéri)', price: 3000, duration: '1h 15m', distance: '70 km', type: 'Inter-city', passport_required: false },
  { id: 'route-buea-lbe', origin: 'Buea (Mile 17)', destination: 'Limbe', price: 1500, duration: '30m', distance: '25 km', type: 'Inter-city', passport_required: false },
  { id: 'route-lbe-buea', origin: 'Limbe', destination: 'Buea (Mile 17)', price: 1500, duration: '30m', distance: '25 km', type: 'Inter-city', passport_required: false },
  { id: 'route-dla-lbe', origin: 'Douala (Akwa)', destination: 'Limbe', price: 3500, duration: '1h 30m', distance: '80 km', type: 'Inter-city', passport_required: false },
  { id: 'route-lbe-dla', origin: 'Limbe', destination: 'Douala (Akwa)', price: 3500, duration: '1h 30m', distance: '80 km', type: 'Inter-city', passport_required: false },
  { id: 'route-yde-buea', origin: 'Yaoundé (Quartier Fouda)', destination: 'Buea (Mile 17)', price: 9000, duration: '5h 00m', distance: '315 km', type: 'Inter-city', passport_required: false },
  { id: 'route-buea-yde', origin: 'Buea (Mile 17)', destination: 'Yaoundé (Quartier Fouda)', price: 9000, duration: '5h 00m', distance: '315 km', type: 'Inter-city', passport_required: false },
  { id: 'route-yde-lbe', origin: 'Yaoundé (Quartier Fouda)', destination: 'Limbe', price: 9500, duration: '5h 30m', distance: '325 km', type: 'Inter-city', passport_required: false },
  { id: 'route-lbe-yde', origin: 'Limbe', destination: 'Yaoundé (Quartier Fouda)', price: 9500, duration: '5h 30m', distance: '325 km', type: 'Inter-city', passport_required: false },

  // Nigeria Direct Bus Lines (Tuesdays & Fridays Only)
  { id: 'route-dla-ikom', origin: 'Douala (Akwa)', destination: 'Ikom (Nigeria)', price: 18000, duration: '6h 30m', distance: '310 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-buea-ikom', origin: 'Buea (Mile 17)', destination: 'Ikom (Nigeria)', price: 16000, duration: '5h 30m', distance: '260 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-lbe-calabar', origin: 'Limbe', destination: 'Calabar (Nigeria)', price: 22000, duration: '6h 00m', distance: '290 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-dla-lagos', origin: 'Douala (Akwa)', destination: 'Lagos (Nigeria)', price: 35000, duration: '16h 00m', distance: '950 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-yde-enugu', origin: 'Yaoundé (Quartier Fouda)', destination: 'Enugu (Nigeria)', price: 25000, duration: '10h 00m', distance: '520 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-bonaberi-onitsha', origin: 'Douala (Bonabéri)', destination: 'Onitsha (Nigeria)', price: 28000, duration: '11h 00m', distance: '580 km', type: 'Cross-Border', passport_required: true },

  // West Africa Extending Transit Routes
  { id: 'route-dla-cotonou', origin: 'Douala (Akwa)', destination: 'Cotonou (Benin)', price: 45000, duration: '24h 00m', distance: '1,150 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-dla-lome', origin: 'Douala (Akwa)', destination: 'Lomé (Togo)', price: 52000, duration: '28h 00m', distance: '1,300 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-dla-accra', origin: 'Douala (Akwa)', destination: 'Accra (Ghana)', price: 60000, duration: '32h 00m', distance: '1,480 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-dla-abidjan', origin: 'Douala (Akwa)', destination: 'Abidjan (Ivory Coast)', price: 75000, duration: '45h 00m', distance: '2,050 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-dla-bamako', origin: 'Douala (Akwa)', destination: 'Bamako (Mali)', price: 85000, duration: '55h 00m', distance: '2,650 km', type: 'Cross-Border', passport_required: true },
  { id: 'route-dla-dakar', origin: 'Douala (Akwa)', destination: 'Dakar (Senegal)', price: 110000, duration: '72h 00m', distance: '3,700 km', type: 'Cross-Border', passport_required: true }
];

export function FleetProvider({ children }) {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFleetData = async () => {
    try {
      // 1. Fetch Buses
      const { data: busData, error: busErr } = await supabase.from('buses').select('*');
      if (busErr) throw busErr;

      let currentBuses = (busData || []).map(b => ({
        ...b,
        id: String(b.id),
        name: String(b.name || 'Coach'),
        plate: String(b.plate || ''),
        type: String(b.type || 'Silver'),
        capacity: Number(b.capacity) || 70,
        status: String(b.status || 'Active'),
        branch: String(b.branch || 'Douala')
      }));

      if (currentBuses.length === 0) {
        const initialBuses = [
          { name: 'Afrique Con Luxury Coach VIP', plate: 'LT-8891-A', type: 'Gold VIP+', capacity: 32, status: 'Active', branch: 'Douala (Akwa)' },
          { name: 'Mercedes Tourismo Express', plate: 'LT-1204-B', type: 'Silver', capacity: 70, status: 'Active', branch: 'Douala (Bonabéri)' },
          { name: 'Toyota Coaster Executive', plate: 'CE-4432-C', type: 'Silver', capacity: 51, status: 'Active', branch: 'Yaoundé (Quartier Fouda)' },
          { name: 'King Long Cross-Border VIP', plate: 'SW-7782-D', type: 'Gold VIP+', capacity: 30, status: 'Active', branch: 'Buea (Mile 17)' },
          { name: 'Yutong Premium Coach', plate: 'SW-3321-I', type: 'Silver', capacity: 70, status: 'Active', branch: 'Limbe' },
          { name: 'Afrique Con Inter-State Transit', plate: 'IK-5544-NG', type: 'Gold VIP+', capacity: 32, status: 'Active', branch: 'Ikom (Nigeria Hub)' }
        ];
        const { data: seededBuses } = await supabase.from('buses').insert(initialBuses).select();
        if (seededBuses) {
          currentBuses = seededBuses.map(b => ({
            ...b,
            id: String(b.id),
            capacity: Number(b.capacity) || 70
          }));
        }
      }
      setBuses(currentBuses);

      // 2. Fetch Routes
      const { data: routeData, error: routeErr } = await supabase.from('routes').select('*');
      if (routeErr) throw routeErr;

      let currentRoutes = (routeData || []).map(r => ({
        ...r,
        id: String(r.id),
        origin: String(r.origin),
        destination: String(r.destination),
        price: Number(r.price) || 5000,
        duration: String(r.duration || '3h 30m'),
        distance: String(r.distance || '245 km'),
        type: String(r.type || 'Inter-city'),
        passportRequired: Boolean(r.passport_required ?? r.passportRequired ?? (r.type === 'Cross-Border')),
        crossBorder: Boolean(r.cross_border ?? (r.type === 'Cross-Border'))
      }));
      
      // Combine DB routes with any missing Afrique Con network routes
      const mergedRoutes = [...currentRoutes];
      for (const defRoute of AFRIQUE_CON_DEFAULT_ROUTES) {
        const exists = mergedRoutes.some(r => r.origin === defRoute.origin && r.destination === defRoute.destination);
        if (!exists) {
          mergedRoutes.push({
            ...defRoute,
            id: String(defRoute.id),
            price: Number(defRoute.price) || 5000,
            passportRequired: Boolean(defRoute.passport_required),
            crossBorder: Boolean(defRoute.type === 'Cross-Border')
          });
        }
      }

      setRoutes(mergedRoutes);

      // 3. Fetch Schedules
      const { data: schedData, error: schedErr } = await supabase.from('schedules').select('*');
      if (schedErr) throw schedErr;

      let currentSchedules = schedData || [];
      const now = new Date();

      // Ensure schedules exist across the 30-day window following the Nigeria Tuesday/Friday rule
      if (currentSchedules.length < 20 && mergedRoutes.length > 0 && currentBuses.length > 0) {
        const generated = [];
        for (let i = 0; i < 14; i++) {
          const targetDate = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
          const dateStr = targetDate.toISOString().split('T')[0];
          const dayOfWeek = targetDate.getUTCDay(); // 2=Tue, 5=Fri

          for (let rIdx = 0; rIdx < mergedRoutes.length; rIdx++) {
            const route = mergedRoutes[rIdx];
            const isNigeria = isNigeriaDestination(route.destination);

            // Rule: Nigeria trips strictly on Tuesdays (2) and Fridays (5)
            if (isNigeria && dayOfWeek !== 2 && dayOfWeek !== 5) {
              continue;
            }

            const assignedBus = currentBuses[rIdx % currentBuses.length];
            if (!assignedBus) continue;

            const depTime = (rIdx % 2 === 0) ? "07:30" : "14:00";
            const arrTime = (rIdx % 2 === 0) ? "11:30" : "19:00";

            generated.push({
              id: `sched-auto-${route.id}-${dateStr}`,
              routeId: String(route.id),
              busId: String(assignedBus.id),
              departureDate: dateStr,
              departureTime: depTime,
              arrivalTime: arrTime,
              status: 'Scheduled'
            });
          }
        }
        currentSchedules = [...currentSchedules, ...generated];
      }

      setSchedules(currentSchedules.map(s => ({
        ...s,
        id: String(s.id),
        routeId: String(s.route_id || s.routeId),
        busId: String(s.bus_id || s.busId),
        departureDate: String(s.departure_date || s.departureDate || now.toISOString().split('T')[0]),
        departureTime: String(s.departure_time || s.departureTime || '08:00:00').slice(0, 5),
        arrivalTime: String(s.arrival_time || s.arrivalTime || '12:00:00').slice(0, 5),
        status: String(s.status || 'Scheduled')
      })));

    } catch (err) {
      console.error('Error fetching Fleet data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  // Bus Operations
  const addBus = async (busData) => {
    const payload = {
      name: busData.name,
      plate: busData.plate,
      type: busData.type,
      capacity: parseInt(busData.capacity, 10) || 70,
      status: busData.status || 'Active',
      branch: busData.branch || 'Douala'
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('buses').insert(payload).select().single();
        if (!error && data) {
          setBuses(prev => [...prev, data]);
          return data;
        }
      } catch (err) {
        console.warn('Supabase addBus failed, queueing offline mutation:', err);
        enqueueOfflineMutation({ type: 'INSERT', table: 'buses', payload });
      }
    }

    const localBus = {
      id: `bus-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString()
    };
    setBuses(prev => [...prev, localBus]);
    return localBus;
  };

  const updateBus = async (busId, updatedFields) => {
    if (isSupabaseConfigured && isUUID(busId)) {
      try {
        await supabase.from('buses').update(updatedFields).eq('id', busId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'UPDATE', table: 'buses', payload: updatedFields, match: { id: busId } });
      }
    }
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, ...updatedFields } : b));
  };

  const deleteBus = async (busId) => {
    if (!busId) return;
    if (isSupabaseConfigured && isUUID(busId)) {
      try {
        await supabase.from('buses').delete().eq('id', busId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'DELETE', table: 'buses', match: { id: busId } });
      }
    }
    setBuses(prev => prev.filter(b => b.id !== busId));
  };

  const deleteBuses = async (busIds = []) => {
    if (!busIds.length) return;
    const idSet = new Set(busIds.map(String));
    if (isSupabaseConfigured) {
      const validUuids = busIds.filter(isUUID);
      if (validUuids.length > 0) {
        try {
          await supabase.from('buses').delete().in('id', validUuids);
        } catch (err) {
          validUuids.forEach(id => {
            enqueueOfflineMutation({ type: 'DELETE', table: 'buses', match: { id } });
          });
        }
      }
    }
    setBuses(prev => prev.filter(b => !idSet.has(String(b.id))));
  };

  // Route Operations
  const addRoute = async (routeData) => {
    const payload = {
      origin: routeData.origin,
      destination: routeData.destination,
      price: Number(routeData.price) || 5000,
      duration: routeData.duration || '5h 00m',
      distance: routeData.distance || '300 km',
      type: routeData.type,
      passport_required: routeData.type === 'Cross-Border'
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('routes').insert(payload).select().single();
        if (!error && data) {
          const formatted = { ...data, passportRequired: data.passport_required };
          setRoutes(prev => [...prev, formatted]);
          return formatted;
        }
      } catch (err) {
        enqueueOfflineMutation({ type: 'INSERT', table: 'routes', payload });
      }
    }

    const localRoute = {
      id: `route-${Date.now()}`,
      ...payload,
      passportRequired: payload.passport_required,
      created_at: new Date().toISOString()
    };
    setRoutes(prev => [...prev, localRoute]);
    return localRoute;
  };

  const updateRoute = async (routeId, updatedFields) => {
    const dbFields = { ...updatedFields };
    if (updatedFields.passportRequired !== undefined) {
      dbFields.passport_required = updatedFields.passportRequired;
      delete dbFields.passportRequired;
    }

    if (isSupabaseConfigured && isUUID(routeId)) {
      try {
        await supabase.from('routes').update(dbFields).eq('id', routeId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'UPDATE', table: 'routes', payload: dbFields, match: { id: routeId } });
      }
    }
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updatedFields } : r));
  };

  const deleteRoute = async (routeId) => {
    if (!routeId) return;
    if (isSupabaseConfigured && isUUID(routeId)) {
      try {
        await supabase.from('routes').delete().eq('id', routeId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'DELETE', table: 'routes', match: { id: routeId } });
      }
    }
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  const deleteRoutes = async (routeIds = []) => {
    if (!routeIds.length) return;
    const idSet = new Set(routeIds.map(String));
    if (isSupabaseConfigured) {
      const validUuids = routeIds.filter(isUUID);
      if (validUuids.length > 0) {
        try {
          await supabase.from('routes').delete().in('id', validUuids);
        } catch (err) {
          validUuids.forEach(id => {
            enqueueOfflineMutation({ type: 'DELETE', table: 'routes', match: { id } });
          });
        }
      }
    }
    setRoutes(prev => prev.filter(r => !idSet.has(String(r.id))));
  };

  // Schedule Operations
  const addSchedule = async (scheduleData) => {
    const route = routes.find(r => r.id === scheduleData.routeId);
    if (route && isNigeriaDestination(route.destination) && !isTuesdayOrFriday(scheduleData.departureDate)) {
      throw new Error('Direct bus lines to Nigeria only depart on Tuesdays and Fridays from Cameroon.');
    }

    const payload = {
      route_id: isUUID(scheduleData.routeId) ? scheduleData.routeId : null,
      bus_id: isUUID(scheduleData.busId) ? scheduleData.busId : null,
      departure_time: scheduleData.departureTime.length === 5 ? scheduleData.departureTime + ':00' : scheduleData.departureTime,
      departure_date: scheduleData.departureDate,
      arrival_time: scheduleData.arrivalTime.length === 5 ? scheduleData.arrivalTime + ':00' : scheduleData.arrivalTime,
      status: 'Scheduled'
    };

    if (isSupabaseConfigured && payload.route_id && payload.bus_id) {
      try {
        const { data, error } = await supabase.from('schedules').insert(payload).select().single();
        if (!error && data) {
          const formatted = {
            ...data,
            routeId: data.route_id,
            busId: data.bus_id,
            departureDate: data.departure_date,
            departureTime: data.departure_time.slice(0, 5),
            arrivalTime: data.arrival_time.slice(0, 5)
          };
          setSchedules(prev => [...prev, formatted]);
          return formatted;
        }
      } catch (err) {
        enqueueOfflineMutation({ type: 'INSERT', table: 'schedules', payload });
      }
    }

    const localSchedule = {
      id: `sched-${Date.now()}`,
      routeId: scheduleData.routeId,
      busId: scheduleData.busId,
      departureDate: scheduleData.departureDate,
      departureTime: scheduleData.departureTime,
      arrivalTime: scheduleData.arrivalTime,
      status: 'Scheduled',
      created_at: new Date().toISOString()
    };
    setSchedules(prev => [...prev, localSchedule]);
    return localSchedule;
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
      dbFields.departure_time = updatedFields.departureTime.length === 5 ? updatedFields.departureTime + ':00' : updatedFields.departureTime;
      delete dbFields.departureTime;
    }
    if (updatedFields.arrivalTime !== undefined) {
      dbFields.arrival_time = updatedFields.arrivalTime.length === 5 ? updatedFields.arrivalTime + ':00' : updatedFields.arrivalTime;
      delete dbFields.arrivalTime;
    }
    if (updatedFields.departureDate !== undefined) {
      dbFields.departure_date = updatedFields.departureDate;
      delete dbFields.departureDate;
    }

    if (isSupabaseConfigured && isUUID(scheduleId)) {
      try {
        await supabase.from('schedules').update(dbFields).eq('id', scheduleId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'UPDATE', table: 'schedules', payload: dbFields, match: { id: scheduleId } });
      }
    }
    setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, ...updatedFields } : s));
  };

  const deleteSchedule = async (scheduleId) => {
    if (!scheduleId) return;
    if (isSupabaseConfigured && isUUID(scheduleId)) {
      try {
        await supabase.from('schedules').delete().eq('id', scheduleId);
      } catch (err) {
        enqueueOfflineMutation({ type: 'DELETE', table: 'schedules', match: { id: scheduleId } });
      }
    }
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
  };

  const deleteSchedules = async (scheduleIds = []) => {
    if (!scheduleIds.length) return;
    const idSet = new Set(scheduleIds.map(String));
    if (isSupabaseConfigured) {
      const validUuids = scheduleIds.filter(isUUID);
      if (validUuids.length > 0) {
        try {
          await supabase.from('schedules').delete().in('id', validUuids);
        } catch (err) {
          validUuids.forEach(id => {
            enqueueOfflineMutation({ type: 'DELETE', table: 'schedules', match: { id } });
          });
        }
      }
    }
    setSchedules(prev => prev.filter(s => !idSet.has(String(s.id))));
  };

  return (
    <FleetContext.Provider
      value={{
        buses,
        routes,
        schedules,
        loading,
        addBus,
        updateBus,
        deleteBus,
        deleteBuses,
        addRoute,
        updateRoute,
        deleteRoute,
        deleteRoutes,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        deleteSchedules,
        loadFleetData
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  return useContext(FleetContext);
}
