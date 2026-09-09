import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

// TransitHub logo SVG (matching the original orange/dark icon)
function TransitHubLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8z" fill="#1a1a1a"/>
          <path d="M7 18v2M17 18v2M4 12h16" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="16" r="1.5" fill="white"/>
          <circle cx="16" cy="16" r="1.5" fill="white"/>
        </svg>
      </div>
      <span className="text-white font-bold text-lg tracking-tight">TransitHub</span>
    </div>
  );
}

export default function Navbar() {
  const { currentUser, logoutUser } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-white/10 text-red-400'
        : 'text-gray-300 hover:text-white'
    }`;

  return (
    <nav className="bg-stone-900 border-b border-stone-850 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/">
            <TransitHubLogo />
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={navLinkClass('/')}>{t('nav.home')}</Link>
            <Link to="/search" className={navLinkClass('/search')}>{t('nav.findTrips')}</Link>
            <Link to="/my-trips" className={navLinkClass('/my-trips')}>{t('nav.myTrips')}</Link>
          </div>

          {/* Right Auth & Language Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 focus:outline-none"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V10a2 2 0 00-2-2h-1.5a2 2 0 01-2-2V4.305M9.9 22.181A9 9 0 1120.1 5.82a9 9 0 01-10.2 16.361z"/>
                </svg>
                <span className="uppercase text-xs font-bold">{language}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-32 bg-stone-900 border border-stone-850 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => { setLanguage('en'); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-between ${language === 'en' ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}
                    >
                      <span>English</span>
                      {language === 'en' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                    </button>
                    <button
                      onClick={() => { setLanguage('fr'); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-between ${language === 'fr' ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}
                    >
                      <span>Français</span>
                      {language === 'fr' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                    </button>
                    <button
                      onClick={() => { setLanguage('pcm'); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-between ${language === 'pcm' ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}
                    >
                      <span>Pidgin</span>
                      {language === 'pcm' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors mr-1"
                  >
                    {t('nav.staffConsole')}
                  </Link>
                )}
                <span className="text-gray-400 text-sm">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-stone-900 border-t border-stone-850 px-4 py-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-1">{t('nav.home')}</Link>
          <Link to="/search" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-1">{t('nav.findTrips')}</Link>
          <Link to="/my-trips" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-1">{t('nav.myTrips')}</Link>
          
          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-850">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Language</span>
            <div className="flex gap-1.5">
              {[
                { code: 'en', label: 'EN' },
                { code: 'fr', label: 'FR' },
                { code: 'pcm', label: 'PCM' }
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${language === l.code ? 'bg-red-500 text-white' : 'bg-stone-800 text-gray-300 hover:text-white'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-850 flex gap-3">
            {currentUser ? (
              <div className="flex flex-col gap-2 w-full">
                {currentUser.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                    {t('nav.staffConsole')}
                  </Link>
                )}
                <div className="flex justify-between items-center w-full">
                  <span className="text-gray-400 text-xs">{currentUser.name}</span>
                  <button onClick={handleLogout} className="text-gray-300 hover:text-white text-sm font-medium">{t('nav.signOut')}</button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-gray-300 hover:text-white text-sm font-medium flex-1 text-center py-1.5 border border-stone-800 rounded-lg">
                  {t('nav.signIn')}
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg flex-1 text-center">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
