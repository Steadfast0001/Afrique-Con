import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const popularRoutes = [
  { origin: 'Yaoundé', destination: 'Douala', duration: '4.5h', distance: '243 km', trips: 2 },
  { origin: 'Douala', destination: 'Bafoussam', duration: '3h', distance: '145 km', trips: 1 },
  { origin: 'Yaoundé', destination: 'Garoua', duration: '12h', distance: '680 km', trips: 0 },
  { origin: 'Yaoundé', destination: 'Bamenda', duration: '7h', distance: '370 km', trips: 1 },
  { origin: 'Bamenda', destination: 'Enugu', duration: '5h', distance: '220 km', trips: 2, crossBorder: true }
];

export default function Home() {
  const { routes } = useApp();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const uniqueOrigins = [...new Set(routes.map(r => r.origin))].sort();
  const uniqueDestinations = [...new Set(routes.map(r => r.destination))].sort();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!from || !to) {
      setError(language === 'fr' ? 'Veuillez sélectionner les villes de départ et d\'arrivée.' : language === 'pcm' ? 'Choose comot place and reach place.' : 'Please select origin and destination cities.');
      return;
    }
    navigate(`/search?from=${from}&to=${to}&date=${date}`);
  };

  const handlePopularRouteClick = (origin, destination) => {
    setFrom(origin);
    setTo(destination);
    setError('');
    navigate(`/search?from=${origin}&to=${destination}&date=${date}`);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white">

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 min-h-[600px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30"></div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-stone-900 border border-stone-850 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {t('home.heroBadge')}
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
              {t('home.heroTitle1')}<br />
              <span className="text-amber-400">{t('home.heroTitle2')}</span>
            </h1>

            {/* Subtext */}
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              {t('home.heroSubtext')}
            </p>
          </div>

          {/* ===== SEARCH FORM CARD ===== */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-3xl">
            {error && (
              <p className="text-red-500 text-sm font-medium mb-4">{error}</p>
            )}
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

                {/* From */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('home.from')}
                  </label>
                  <select
                    value={from}
                    onChange={e => { setFrom(e.target.value); setError(''); }}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">{t('home.selectCity')}</option>
                    {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* To */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('home.to')}
                  </label>
                  <select
                    value={to}
                    onChange={e => { setTo(e.target.value); setError(''); }}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="">{t('home.selectCity')}</option>
                    {uniqueDestinations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Travel Date */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('home.travelDate')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-900 font-bold py-3.5 rounded-xl text-base flex items-center justify-center gap-2.5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('home.searchTripsBtn')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== POPULAR ROUTES SECTION ===== */}
      <section className="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">{t('home.popularRoutes')}</h2>
            <p className="text-stone-500 text-sm mt-2">{t('home.popularRoutesSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route, idx) => (
              <div 
                key={idx}
                onClick={() => handlePopularRouteClick(route.origin, route.destination)}
                className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-950 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-stone-900 font-extrabold text-base">
                      <span>{route.origin}</span>
                      <span className="text-stone-400 font-normal">→</span>
                      <span>{route.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 font-medium">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {route.duration}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span>{route.distance}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-12 flex-shrink-0">
                  <div>
                    {route.crossBorder && (
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {t('home.crossBorder')}
                      </span>
                    )}
                  </div>
                  <span className="text-amber-600 text-xs font-extrabold">
                    {route.trips} {t('home.tripsCount')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY TRAVEL WITH TRANSITHUB? SECTION ===== */}
      <section className="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {language === 'fr' ? 'Pourquoi voyager avec TransitHub ?' : language === 'pcm' ? 'Why Passenger Dem Like TransitHub?' : 'Why Travel With TransitHub?'}
            </h2>
            <p className="text-stone-500 text-sm mt-2">
              {language === 'fr' ? 'Une expérience de réservation moderne conçue pour les voyageurs africains' : language === 'pcm' ? 'Correct waka booking for phone build for Africa waka' : 'A modern booking experience built for African travelers'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Choose Your Seat */}
            <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-amber-100">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-stone-900 font-extrabold text-lg mb-3">
                {language === 'fr' ? 'Choisissez votre siège' : language === 'pcm' ? 'Choose your seat' : 'Choose Your Seat'}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {language === 'fr' ? 'Choisissez votre siège préféré sur notre carte interactive en direct avant de payer.' : language === 'pcm' ? 'Pick your own seat from our live map before you pay money.' : 'Pick your favorite seat from our live interactive seat map before you pay.'}
              </p>
            </div>

            {/* Secure Payments */}
            <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-100">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-stone-900 font-extrabold text-lg mb-3">
                {language === 'fr' ? 'Paiements sécurisés' : language === 'pcm' ? 'Secure Pay Place' : 'Secure Payments'}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {t('home.feature2Desc')}
              </p>
            </div>

            {/* Cross-Border Ready */}
            <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-indigo-100">
                <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-stone-900 font-extrabold text-lg mb-3">
                {t('home.feature1Title')}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {t('home.feature1Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICE CLASSES SECTION ===== */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {language === 'fr' ? 'Choisissez votre niveau de confort' : language === 'pcm' ? 'Choose how you want travel' : 'Choose Your Comfort Level'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Silver Comfort */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {language === 'fr' ? 'Confort Silver' : language === 'pcm' ? 'Silver Class' : 'Silver Comfort'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {language === 'fr' ? 'Voyage interurbain standard' : language === 'pcm' ? 'Standard waka inside town' : 'Standard inter-city travel'}
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {(language === 'fr' 
                  ? ['Sièges inclinables (disposition 2+2)', 'Climatisation', 'Divertissement à bord', '1 arrêt de rafraîchissement']
                  : language === 'pcm'
                  ? ['Seat wey fit bend (2+2 layout)', 'AC dey inside', 'Entertainment for screen', '1 break place for buy small chop']
                  : ['Reclining seats (2+2 layout)', 'Air conditioning', 'Onboard entertainment', '1 stop refreshment break']
                ).map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Gold VIP+ */}
            <div className="bg-white border-2 border-amber-400 rounded-2xl p-7 relative">
              <div className="absolute -top-3 right-5">
                <span className="bg-amber-500 text-gray-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">PREMIUM</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Gold VIP+</h3>
                  <p className="text-gray-500 text-sm">
                    {language === 'fr' ? 'Voyage de luxe longue distance' : language === 'pcm' ? 'Fine luxury travel for far road' : 'Luxury long-distance travel'}
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {(language === 'fr'
                  ? ['Sièges inclinables extra-larges (2+1)', 'Écrans individuels et Wi-Fi', 'Collations et boissons gratuites', 'Couverture et oreiller inclus']
                  : language === 'pcm'
                  ? ['Extra-wide reclining seat dem (2+1)', 'Screen for every seat & Wi-Fi', 'Free small chop and soft drink', 'Free blanket & pillow']
                  : ['Extra-wide reclining seats (2+1)', 'Individual screens & Wi-Fi', 'Complimentary snacks & drinks', 'Blanket & pillow included']
                ).map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-stone-950 border-t border-stone-850 pt-14 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8z" fill="#1a1a1a"/>
                    <path d="M7 18v2M17 18v2M4 12h16" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="16" r="1.5" fill="white"/>
                    <circle cx="16" cy="16" r="1.5" fill="white"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-base">TransitHub</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                {language === 'fr' ? 'Réservation de transports interurbains et transfrontaliers, simplifiée.' : language === 'pcm' ? 'Waka inside and outside country booking, make easy.' : 'Inter-city & cross-border transport booking, simplified.'}
              </p>
            </div>

            {/* Travel */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">
                {language === 'fr' ? 'Voyager' : language === 'pcm' ? 'Waka' : 'Travel'}
              </h4>
              <ul className="space-y-3">
                {[
                  { label: t('nav.findTrips'), to: '/search' },
                  { label: t('nav.myTrips'), to: '/my-trips' },
                  { label: t('nav.staffConsole'), to: '/admin' }
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.to} className="text-gray-400 hover:text-white text-sm transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
              <ul className="space-y-3">
                {(language === 'fr' 
                  ? ['Centre d\'aide', 'Politique d\'annulation', 'Politique de remboursement']
                  : language === 'pcm'
                  ? ['Help Place', 'Rules for Cancel', 'Rules for Refund']
                  : ['Help Center', 'Cancellation Policy', 'Refund Policy']
                ).map(item => (
                  <li key={item}>
                    <span className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="text-gray-400 text-sm">+237 6 77 12 34 56</li>
                <li className="text-gray-400 text-sm">support@transithub.cm</li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-stone-850">
            <p className="text-gray-600 text-xs">
              © 2026 TransitHub. {language === 'fr' ? 'Tous droits réservés.' : language === 'pcm' ? 'No duplicate.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
