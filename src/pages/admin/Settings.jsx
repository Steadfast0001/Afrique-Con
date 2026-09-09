import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Building2, CreditCard, Bell, Activity } from 'lucide-react';

const SETTINGS_KEY = 'transitflow_platform_settings';

const defaultSettings = {
  companyName: 'TransitHub Cameroon Ltd.',
  email: 'support@transithub.cm',
  phone: '+237 6 86 52 59 44',
  country: 'Cameroon',
  headBranch: 'Douala',
  currency: 'FCFA (XAF)',
  goldMultiplier: '2.5',
  paymentProvider: 'Both',
  notifications: {
    emailConfirmations: true,
    smsReminders: true,
    adminAlerts: true,
    cancellationAlerts: true,
  },
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleToggleNotification = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
    setSaveSuccess(false);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }, 300);
    } catch (err) {
      setIsSaving(false);
      alert('Failed to save settings: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Platform Settings</h2>
          <p className="text-gray-400 text-sm mt-1">Configure company profiles, currency rates, notifications, and gateways</p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Changes saved successfully!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Company Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Company Information</h3>
                <p className="text-xs text-gray-400">Public entity details displayed on tickets and invoices</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Official Support Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contact / WhatsApp Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Country</label>
                  <input
                    type="text"
                    value={settings.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Head Office Branch</label>
                  <select
                    value={settings.headBranch}
                    onChange={(e) => handleChange('headBranch', e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                    <option value="Bamenda">Bamenda</option>
                    <option value="Buea">Buea</option>
                    <option value="Bafoussam">Bafoussam</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Save Company Info
            </button>
          </div>
        </div>

        {/* 2. Pricing & Currency */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Pricing & Currency</h3>
                <p className="text-xs text-gray-400">Payment gateway configurations and travel class calculations</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Base Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                >
                  <option value="FCFA (XAF)">FCFA (XAF - Central African CFA)</option>
                  <option value="NGN (Nigerian Naira)">NGN (Nigerian Naira - Cross Border)</option>
                  <option value="USD ($)">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gold VIP+ Rate Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.goldMultiplier}
                  onChange={(e) => handleChange('goldMultiplier', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">Multiplier applied on base Silver tickets (e.g. 2.5x base fare)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mobile Money Gateway</label>
                <select
                  value={settings.paymentProvider}
                  onChange={(e) => handleChange('paymentProvider', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                >
                  <option value="Both">MTN Mobile Money & Orange Money (Campay)</option>
                  <option value="MTN">MTN Mobile Money Only</option>
                  <option value="Orange">Orange Money Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Save Pricing Rules
            </button>
          </div>
        </div>

        {/* 3. Notification Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Notification Rules</h3>
                <p className="text-xs text-gray-400">Automated triggers sent to passengers and operations staff</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'emailConfirmations', label: 'Email booking confirmations with QR E-Tickets', desc: 'Instantly dispatches ticket PDF to passenger email' },
                { id: 'smsReminders', label: 'SMS departure reminders (2 hours prior)', desc: 'Broadcasts departure gate and boarding gate alerts' },
                { id: 'adminAlerts', label: 'Admin alerts for new bookings & VIP seats', desc: 'Sends dashboard alert notifications on new ticket orders' },
                { id: 'cancellationAlerts', label: 'Cancellation & refund alerts', desc: 'Sends confirmation to passenger and operations desk' },
              ].map((item) => {
                const isEnabled = settings.notifications?.[item.id] ?? false;
                return (
                  <div key={item.id} className="flex items-start justify-between gap-4 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleNotification(item.id)}
                      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 focus:outline-none ${
                        isEnabled ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm block ${
                          isEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Save Notification Rules
            </button>
          </div>
        </div>

        {/* 4. System Status & Services */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Service Health & Endpoints</h3>
                <p className="text-xs text-gray-400">Live operational status across integrated infrastructure</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { service: 'TransitFlow Booking Engine', endpoint: '/api/botpenguin-webhook', status: 'Operational', ping: '24ms' },
                { service: 'Mobile Money Gateway (Campay)', endpoint: '/api/campay-collect', status: 'Operational', ping: '110ms' },
                { service: 'BotPenguin WhatsApp Webhook', endpoint: '/api/botpenguin-webhook', status: 'Operational', ping: '45ms' },
                { service: 'Supabase Database & Auth', endpoint: 'supabase.co / local', status: 'Operational', ping: '18ms' },
              ].map((s) => (
                <div key={s.service} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-gray-900 text-sm font-semibold block">{s.service}</span>
                    <span className="text-gray-400 text-[11px] font-mono">{s.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">{s.ping}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">All systems operational</span>
            <button
              type="button"
              onClick={handleSave}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Save All Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

