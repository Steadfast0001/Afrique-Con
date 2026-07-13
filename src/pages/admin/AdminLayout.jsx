import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TransitBot from '../../components/TransitBot';

// Sidebar Icon Components
const icons = {
  dashboard: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2}/>
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2}/>
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2}/>
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2}/>
    </svg>
  ),
  fleet: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 19v2M16 19v2M3 5h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11h18"/>
    </svg>
  ),
  routes: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
    </svg>
  ),
  schedules: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/>
      <path strokeLinecap="round" strokeWidth={2} d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  bookings: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth={2}/>
      <path strokeLinecap="round" strokeWidth={2} d="M16 2l-4 5-4-5M8 14l2 2 4-4"/>
    </svg>
  ),
  support: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
  manifests: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  agent: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  settings: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <circle cx="12" cy="12" r="3" strokeWidth={2}/>
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
    </svg>
  ),
};

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export default function AdminLayout() {
  const { currentUser, logoutUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-sm shadow-lg">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.74-2.99L13.74 4a2 2 0 00-3.48 0L3.26 16.01A2 2 0 005.07 19z"/>
            </svg>
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">Access Restricted</h3>
          <p className="text-gray-500 text-sm mb-6">Sign in as administrator to access the Operations Console.</p>
          <Link to="/login" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors inline-block">Sign In</Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/';
    return location.pathname.startsWith(path);
  };

  const linkClass = (path) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
    isActive(path)
      ? 'bg-amber-500/20 text-amber-400'
      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
  }`;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-stone-900 border-r border-stone-850 flex flex-col shrink-0 overflow-y-auto">

        {/* Brand Header */}
        <div className="p-5 border-b border-stone-850">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8z" fill="#1a1a1a"/>
                <path d="M7 18v2M17 18v2M4 12h16" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="16" r="1.5" fill="white"/>
                <circle cx="16" cy="16" r="1.5" fill="white"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">TransitHub</p>
              <p className="text-stone-500 text-[10px] font-semibold uppercase tracking-widest">Operations Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">

          {/* OPERATIONS Group */}
          <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-2">Operations</p>
          <Link to="/admin" className={linkClass('/admin')}>
            {icons.dashboard}<span>Dashboard</span>
          </Link>
          <Link to="/admin/fleet" className={linkClass('/admin/fleet')}>
            {icons.fleet}<span>Fleet Management</span>
          </Link>
          <Link to="/admin/routes" className={linkClass('/admin/routes')}>
            {icons.routes}<span>Routes</span>
          </Link>
          <Link to="/admin/schedules" className={linkClass('/admin/schedules')}>
            {icons.schedules}<span>Schedules</span>
          </Link>
          <Link to="/admin/bookings" className={linkClass('/admin/bookings')}>
            {icons.bookings}<span>Bookings</span>
          </Link>

          {/* SUPPORT Group */}
          <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-5 pb-2">Support &amp; Compliance</p>
          <Link to="/admin/support" className={linkClass('/admin/support')}>
            {icons.support}<span>Support Desk</span>
          </Link>
          <Link to="/admin/manifests" className={linkClass('/admin/manifests')}>
            {icons.manifests}<span>Manifests</span>
          </Link>
          <Link to="/admin/agent-console" className={linkClass('/admin/agent-console')}>
            {icons.agent}<span>Agent Console</span>
          </Link>

          {/* SYSTEM Group */}
          <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-5 pb-2">System</p>
          <Link to="/admin/settings" className={linkClass('/admin/settings')}>
            {icons.settings}<span>Settings</span>
          </Link>

        </nav>

        {/* User Info + Logout */}
        <div className="p-3 border-t border-stone-850">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-gray-900 font-black text-sm flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{currentUser.name}</p>
              <p className="text-stone-500 text-xs">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="text-stone-500 hover:text-stone-300 transition-colors p-1" title="Sign Out">
              {icons.logout}
            </button>
          </div>
        </div>

      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-y-auto bg-gray-50">

        {/* Page Header Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {location.pathname === '/admin' || location.pathname === '/admin/' ? 'Dashboard'
                : location.pathname.includes('/fleet') ? 'Fleet Management'
                : location.pathname.includes('/routes') ? 'Routes'
                : location.pathname.includes('/schedules') ? 'Schedules'
                : location.pathname.includes('/bookings') ? 'Bookings'
                : location.pathname.includes('/support') ? 'Support Desk'
                : location.pathname.includes('/manifests') ? 'Manifests'
                : location.pathname.includes('/agent') ? 'Agent Console'
                : location.pathname.includes('/settings') ? 'Settings'
                : 'Dashboard'}
            </h1>
            <p className="text-gray-400 text-sm">{today}</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            System Live
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>

        <TransitBot />

      </main>
    </div>
  );
}
