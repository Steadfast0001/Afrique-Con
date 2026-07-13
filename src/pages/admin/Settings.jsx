import React from 'react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Manage platform configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Company Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-4">
            {[
              { label: 'Company Name', value: 'TransitHub Cameroon Ltd.' },
              { label: 'Email', value: 'support@transithub.cm' },
              { label: 'Phone', value: '+237 6 77 12 34 56' },
              { label: 'Country', value: 'Cameroon' },
            ].map(item => (
              <div key={item.label}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{item.label}</label>
                <input
                  type="text"
                  defaultValue={item.value}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
            <button className="mt-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        {/* Pricing & Currency */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Pricing & Currency</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Currency</label>
              <select className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option className="bg-white text-gray-900">FCFA (XAF)</option>
                <option className="bg-white text-gray-900">NGN (Nigerian Naira)</option>
                <option className="bg-white text-gray-900">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gold Class Multiplier</label>
              <input type="number" defaultValue="2.5" className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mobile Money Provider</label>
              <select className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option className="bg-white text-gray-900">MTN Mobile Money</option>
                <option className="bg-white text-gray-900">Orange Money</option>
                <option className="bg-white text-gray-900">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-4">
            {[
              { label: 'Email booking confirmations', enabled: true },
              { label: 'SMS departure reminders', enabled: true },
              { label: 'Admin alerts for new bookings', enabled: false },
              { label: 'Cancellation notifications', enabled: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">{item.label}</span>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${item.enabled ? 'bg-amber-500' : 'bg-stone-850'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { service: 'Booking Engine', status: 'Operational' },
              { service: 'Payment Gateway', status: 'Operational' },
              { service: 'SMS Gateway', status: 'Degraded' },
              { service: 'Email Service', status: 'Operational' },
            ].map(s => (
              <div key={s.service} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <span className="text-gray-600 text-sm">{s.service}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  s.status === 'Operational' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
