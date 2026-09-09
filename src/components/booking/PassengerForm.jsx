import React from 'react';
import { User, PhoneCall } from 'lucide-react';

export function PassengerForm({
  passengerList,
  onPassengerChange,
  contactEmail,
  onContactEmailChange,
  contactPhone,
  onContactPhoneChange,
  passportRequired,
  errors,
  onSubmit,
  t
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-8">
      {/* Contact Information */}
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-1">{t ? t('book.contactInfo') : 'Contact Information'}</h2>
        <p className="text-gray-400 text-sm mb-6">Booking confirmation and ticket will be sent to this email & WhatsApp number.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t ? t('book.emailAddress') : 'Email Address'} *
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => onContactEmailChange(e.target.value)}
              placeholder="e.g. steadybeks@gmail.com"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                errors.contactEmail ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-red-100 focus:border-red-500'
              }`}
            />
            {errors.contactEmail && <p className="text-xs text-red-500 font-bold mt-1.5">{errors.contactEmail}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              WhatsApp / Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => onContactPhoneChange(e.target.value)}
                placeholder="e.g. 670123456"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
              />
              <PhoneCall className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Passenger Seat Details */}
      <div className="pt-6 border-t border-gray-100">
        <h2 className="text-xl font-black text-gray-900 mb-1">{t ? t('book.passengerDetails') : 'Passenger Details'}</h2>
        <p className="text-gray-400 text-sm mb-6">Enter passenger names as they appear on official IDs.</p>

        <div className="space-y-4">
          {passengerList.map((p, idx) => (
            <div key={p.seat} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-black">
                  Seat {p.seat}
                </span>
                <span className="text-xs font-bold text-gray-500">Passenger #{idx + 1}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => onPassengerChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Steady Beks"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all bg-white focus:outline-none focus:ring-2 ${
                        errors[`name_${idx}`] ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                    />
                    <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  </div>
                  {errors[`name_${idx}`] && (
                    <p className="text-xs text-red-500 font-bold mt-1.5">{errors[`name_${idx}`]}</p>
                  )}
                </div>

                {passportRequired && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Passport / National ID Number *
                    </label>
                    <input
                      type="text"
                      value={p.passportNumber}
                      onChange={(e) => onPassengerChange(idx, 'passportNumber', e.target.value)}
                      placeholder="e.g. CM-10928371"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all bg-white focus:outline-none focus:ring-2 ${
                        errors[`passport_${idx}`] ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-red-100 focus:border-red-500'
                      }`}
                    />
                    {errors[`passport_${idx}`] && (
                      <p className="text-xs text-red-500 font-bold mt-1.5">{errors[`passport_${idx}`]}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all text-sm uppercase tracking-wider"
      >
        {t ? t('book.continueToPayment') : 'Continue to Payment'} →
      </button>
    </form>
  );
}

export default PassengerForm;
