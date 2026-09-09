import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export default function Search() {
  const { routes, schedules, buses, bookings } = useApp();
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';

  const [modFrom, setModFrom] = useState(from);
  const [modTo, setModTo] = useState(to);
  const [modDate, setModDate] = useState(date);

  const uniqueOrigins = [...new Set(routes.map(r => r.origin))].sort();
  const uniqueDestinations = [...new Set(routes.map(r => r.destination))].sort();

  useEffect(() => { setModFrom(from); setModTo(to); setModDate(date); }, [from, to, date]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ from: modFrom, to: modTo, date: modDate });
  };

  const getResults = () => {
    const matchingRouteIds = routes
      .filter(r =>
        (!from || r.origin.toLowerCase() === from.toLowerCase()) &&
        (!to || r.destination.toLowerCase() === to.toLowerCase())
      )
      .map(r => r.id);

    return schedules
      .filter(s => {
        const matchesRoute = matchingRouteIds.includes(s.routeId);
        const schedDate = s.departureDate || s.departure_date;
        const matchesDate = !date || schedDate === date;
        return matchesRoute && matchesDate;
      })
      .map(schedule => {
        const route = routes.find(r => r.id === schedule.routeId);
        const bus = buses.find(b => b.id === schedule.busId);
        const scheduleBookings = bookings.filter(b => b.scheduleId === schedule.id && b.checkInStatus !== 'Cancelled');
        const bookedCount = scheduleBookings.reduce((sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : (b.seats ? 1 : 0)), 0);
        const seatsLeft = bus ? Math.max(0, (Number(bus.capacity) || 70) - bookedCount) : 0;
        return {
          ...schedule,
          departureDate: schedule.departureDate || schedule.departure_date || new Date().toISOString().split('T')[0],
          departureTime: schedule.departureTime || (schedule.departure_time ? schedule.departure_time.slice(0, 5) : '08:00'),
          route,
          bus,
          seatsLeft
        };
      });
  };

  const results = getResults();

  const getResultsSubText = () => {
    const tripText = results.length === 1 
      ? (language === 'fr' ? 'trajet trouvé' : language === 'pcm' ? 'waka found' : 'trip found')
      : (language === 'fr' ? 'trajets trouvés' : language === 'pcm' ? 'waka dem found' : 'trips found');
    
    const prefix = from && to 
      ? `${from} → ${to} · ` 
      : `${t('search.allDates')} · `;
      
    return `${prefix}${results.length} ${tripText}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== TOP SEARCH BAR ===== */}
      <div className="bg-gradient-to-b from-stone-900 to-stone-800 border-b border-stone-700 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-end shadow-lg">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {t('search.from')}
              </label>
              <select value={modFrom} onChange={e => setModFrom(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 appearance-none cursor-pointer">
                <option value="">{t('search.anyCity')}</option>
                {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {t('search.to')}
              </label>
              <select value={modTo} onChange={e => setModTo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 appearance-none cursor-pointer">
                <option value="">{t('search.anyCity')}</option>
                {uniqueDestinations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {t('search.date')}
              </label>
              <input type="date" value={modDate} onChange={e => setModDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"/>
            </div>
            <button type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-7 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors whitespace-nowrap flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              {t('search.searchBtn')}
            </button>
          </form>
        </div>
      </div>

      {/* ===== RESULTS ===== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('search.title')}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {getResultsSubText()}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
            <p className="text-gray-500 text-base">{t('search.noTrips')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('search.noTripsSub')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(trip => (
              <div key={trip.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-5 flex-grow">
                    <div className="w-14 h-14 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18"/>
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-gray-900 font-bold text-lg">
                          {trip.route?.origin} → {trip.route?.destination}
                        </span>
                        {trip.route?.type === 'Cross-Border' && (
                          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">
                            {t('search.crossBorder')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 text-xs">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                          </svg>
                          {trip.departureDate} · {trip.departureTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
                          </svg>
                          {trip.seatsLeft} {t('search.seatsLeft')}
                        </span>
                        <span className="text-gray-400">{trip.bus?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center border border-gray-200 rounded-lg px-4 py-2 bg-gray-50/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SILVER</p>
                      <p className="text-lg font-black text-gray-900">{(trip.route?.price || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-medium">FCFA</p>
                    </div>
                    <div className="text-center border border-red-200 rounded-lg px-4 py-2 bg-red-50/50">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">GOLD VIP+</p>
                      <p className="text-lg font-black text-red-600">{((trip.route?.price || 0) * 2.5).toLocaleString()}</p>
                      <p className="text-[10px] text-red-500 font-medium">FCFA</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={trip.seatsLeft <= 0}
                    onClick={() => navigate(`/book/${trip.id}`)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                      trip.seatsLeft > 0
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {t('book.step1')}
                    {trip.seatsLeft > 0 && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
