import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Ticket, Calendar, Clock, Eye, Bus, Info } from 'lucide-react';

export default function MyTrips() {
  const { bookings, schedules, routes, cancelBooking, currentUser } = useApp();
  const navigate = useNavigate();

  // If not logged in, show the prompt screen
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        {/* Ticket Icon Wrapper */}
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200 mb-6 shadow-sm">
          <Ticket className="w-8 h-8 text-amber-500" />
        </div>
        
        {/* Texts */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your trips</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm">
          Access your booking history and download tickets.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="border border-gray-300 hover:border-gray-450 hover:bg-gray-50 text-gray-700 font-bold px-6 py-2.5 rounded-lg text-sm transition-all bg-white"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow-md active:scale-97"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  // Filter bookings for the logged-in user
  const matchingBookings = bookings.filter(
    b => b.userId === currentUser.id || b.passengerEmail?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()
  );

  const getTripDetails = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const route = schedule ? routes.find(r => r.id === schedule.routeId) : null;
    return { schedule, route };
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking and request a refund?')) {
      await cancelBooking(bookingId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 bg-gray-50 text-gray-900 min-h-screen">
      
      {/* Header with Title and Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">My Trips</h2>
          <p className="text-gray-450 text-sm">
            {matchingBookings.length} booking{matchingBookings.length !== 1 ? 's' : ''} &bull; Welcome back, {currentUser.name}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-amber-500 hover:bg-amber-650 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm active:scale-97"
        >
          Book New Trip
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {matchingBookings.length > 0 ? (
          matchingBookings.map(booking => {
            const { schedule, route } = getTripDetails(booking.scheduleId);
            
            if (!schedule || !route) return null;

            const isCancelled = booking.checkInStatus === 'Cancelled';

            return (
              <div 
                key={booking.id}
                className="bg-white border border-gray-250/80 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                
                {/* Left: Bus Icon in Dark container */}
                <div className="flex items-center gap-4 flex-grow">
                  <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center text-amber-500 flex-shrink-0">
                    <Bus className="w-6 h-6" />
                  </div>

                  {/* Middle Info Column */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-900 font-extrabold text-base">{route.origin} &mdash; {route.destination}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCancelled
                          ? 'bg-red-50 text-red-650 border-red-200'
                          : booking.paymentStatus?.toLowerCase() === 'paid'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {booking.checkInStatus || 'Confirmed'}
                      </span>
                    </div>

                    {/* Metadata line with icons */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{schedule.departureDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{schedule.departureTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Seat {booking.seats ? booking.seats.join(', ') : 'None'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Ref: {booking.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right detail & Actions */}
                <div className="w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end gap-3 self-stretch border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-base font-extrabold text-gray-900 block">{booking.totalAmount?.toLocaleString()} FCFA</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                      {booking.travelClass || 'Gold'} &bull; {booking.paymentStatus || 'Paid'}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/ticket/${booking.id}`)}
                      className="border border-gray-250 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 bg-white"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      <span>View</span>
                    </button>
                    {!isCancelled && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="border border-red-200 hover:bg-red-50 text-red-650 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center text-gray-400 text-sm shadow-sm">
            <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p>You don't have any booked trips yet.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 text-amber-500 hover:text-amber-600 font-bold text-xs"
            >
              Start booking now &rarr;
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
