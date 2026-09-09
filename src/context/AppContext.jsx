import React from 'react';
import { AuthProvider, useAuth, isAdminEmail, getLocalUsers, saveLocalUsers, LOCAL_USERS_KEY, LOCAL_SESSION_KEY, ADMIN_EMAILS } from './AuthContext';
import { FleetProvider, useFleet } from './FleetContext';
import { BookingProvider, useBooking } from './BookingContext';

export { useAuth, useFleet, useBooking, isAdminEmail, getLocalUsers, saveLocalUsers, LOCAL_USERS_KEY, LOCAL_SESSION_KEY, ADMIN_EMAILS };

/**
 * AppProvider: High-level composed provider wrapping domain contexts in logical dependency order
 */
export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <FleetProvider>
        <BookingProvider>
          {children}
        </BookingProvider>
      </FleetProvider>
    </AuthProvider>
  );
}

/**
 * useApp: Unified Facade Hook for complete backward compatibility across all existing pages & admin consoles
 */
export function useApp() {
  const auth = useAuth();
  const fleet = useFleet();
  const booking = useBooking();

  return {
    // Auth Domain
    currentUser: auth?.currentUser,
    authLoading: auth?.loading,
    registerUser: auth?.registerUser,
    loginUser: auth?.loginUser,
    loginWithGoogle: auth?.loginWithGoogle,
    logoutUser: auth?.logoutUser,
    isAdminEmail: auth?.isAdminEmail,

    // Fleet Domain
    buses: fleet?.buses || [],
    routes: fleet?.routes || [],
    schedules: fleet?.schedules || [],
    fleetLoading: fleet?.loading,
    addBus: fleet?.addBus,
    updateBus: fleet?.updateBus,
    deleteBus: fleet?.deleteBus,
    deleteBuses: fleet?.deleteBuses,
    addRoute: fleet?.addRoute,
    updateRoute: fleet?.updateRoute,
    deleteRoute: fleet?.deleteRoute,
    deleteRoutes: fleet?.deleteRoutes,
    addSchedule: fleet?.addSchedule,
    updateSchedule: fleet?.updateSchedule,
    deleteSchedule: fleet?.deleteSchedule,
    deleteSchedules: fleet?.deleteSchedules,
    loadFleetData: fleet?.loadFleetData,

    // Booking Domain
    bookings: booking?.bookings || [],
    supportTickets: booking?.supportTickets || [],
    bookingLoading: booking?.loading,
    addBooking: booking?.addBooking,
    updateBooking: booking?.updateBooking,
    deleteBooking: booking?.deleteBooking,
    deleteBookings: booking?.deleteBookings,
    cancelBooking: booking?.cancelBooking,
    toggleCheckIn: booking?.toggleCheckIn,
    addSupportTicket: booking?.addSupportTicket,
    updateTicketStatus: booking?.updateTicketStatus,
    replySupportTicket: booking?.replySupportTicket,
    deleteSupportTicket: booking?.deleteSupportTicket,
    deleteSupportTickets: booking?.deleteSupportTickets,
    loadBookingData: booking?.loadBookingData
  };
}

export default AppProvider;
