import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// TransitHub logo SVG (matching the original orange/dark icon)
function TransitHubLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
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
  const [mobileOpen, setMobileOpen] = useState(false);
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
        ? 'bg-white/10 text-amber-400'
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
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/search" className={navLinkClass('/search')}>Find Trips</Link>
            <Link to="/my-trips" className={navLinkClass('/my-trips')}>My Trips</Link>
          </div>

          {/* Right Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors mr-1"
                  >
                    Staff Console
                  </Link>
                )}
                <span className="text-gray-400 text-sm">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-bold px-5 py-2 rounded-lg transition-colors"
                >
                  Register
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
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-1">Home</Link>
          <Link to="/search" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-1">Find Trips</Link>
          <Link to="/my-trips" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-1">My Trips</Link>
          <div className="pt-3 border-t border-stone-850 flex gap-3">
            {currentUser ? (
              <button onClick={handleLogout} className="text-gray-300 hover:text-white text-sm font-medium">Sign Out</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-gray-300 hover:text-white text-sm font-medium">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-bold px-4 py-1.5 rounded-lg">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
