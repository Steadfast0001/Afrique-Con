import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Book from './pages/Book';
import Ticket from './pages/Ticket';
import MyTrips from './pages/MyTrips';
import Auth from './pages/Auth';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import FleetManager from './pages/admin/FleetManager';
import RoutesManager from './pages/admin/RoutesManager';
import SchedulesManager from './pages/admin/SchedulesManager';
import Manifests from './pages/admin/Manifests';
import AgentConsole from './pages/admin/AgentConsole';
import Bookings from './pages/admin/Bookings';
import SupportDesk from './pages/admin/SupportDesk';
import Settings from './pages/admin/Settings';

import TransitBot from './components/TransitBot';

// Standard User Layout: Navbar on top, page content below
function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 overflow-x-hidden w-full max-w-full">
      <div className="no-print">
        <Navbar />
      </div>
      <main className="flex-1 overflow-x-hidden w-full max-w-full">
        <Outlet />
      </main>
      <div className="no-print">
        <TransitBot />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* User-facing routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="book/:id" element={<Book />} />
          <Route path="ticket/:id" element={<Ticket />} />
          <Route path="my-trips" element={<MyTrips />} />
          <Route path="login" element={<Auth mode="login" />} />
          <Route path="register" element={<Auth mode="register" />} />
          <Route path="forgot-password" element={<Auth mode="forgot" />} />
        </Route>

        {/* Admin console routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="fleet" element={<FleetManager />} />
          <Route path="routes" element={<RoutesManager />} />
          <Route path="schedules" element={<SchedulesManager />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="support" element={<SupportDesk />} />
          <Route path="manifests" element={<Manifests />} />
          <Route path="agent-console" element={<AgentConsole />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
