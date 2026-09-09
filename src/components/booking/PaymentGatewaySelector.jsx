import React from 'react';
import { CreditCard, PhoneCall, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function PaymentGatewaySelector({
  paymentMethod,
  onPaymentMethodChange,
  paymentAccount,
  onPaymentAccountChange,
  errors,
  onSubmit,
  totalAmount,
  showCampayModal,
  campayStatus,
  campayError,
  campayRef,
  onCloseModal,
  isAdmin = false,
  t
}) {
  const availableMethods = [
    { id: 'Mobile Money', label: 'MTN / Orange MoMo', icon: PhoneCall },
    { id: 'Credit Card', label: 'Debit / Credit Card', icon: CreditCard },
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: CreditCard },
    ...(isAdmin ? [{ id: 'Cash', label: 'Pay at Terminal (Admin)', icon: CreditCard }] : [])
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900 mb-1">{t ? t('book.paymentMethod') : 'Select Payment Method'}</h2>
        <p className="text-gray-400 text-sm">Secure instant transaction powered by CamPay & Stripe</p>
      </div>

      {/* Method Badges */}
      <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {availableMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = paymentMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onPaymentMethodChange(method.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-red-500 bg-red-50/50 shadow-sm scale-102 ring-2 ring-red-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-red-500' : 'text-gray-400'}`} />
              <span className={`text-xs font-black ${isSelected ? 'text-red-600' : 'text-gray-700'}`}>
                {method.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Method Details Input */}
      <form onSubmit={onSubmit} className="space-y-6 pt-4 border-t border-gray-100">
        {paymentMethod === 'Cash' && isAdmin ? (
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider block mb-1">
                ★ Admin Terminal Cash Desk Mode
              </span>
              <p className="text-xs text-amber-700">
                This option is restricted to station attendants & administrators. The ticket will be registered immediately with <strong>Paid</strong> status upon confirmation.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Cash Receipt Ref / Attendant Note (Optional)
              </label>
              <input
                type="text"
                value={paymentAccount}
                onChange={(e) => onPaymentAccountChange(e.target.value)}
                placeholder="e.g. Douala Terminal Desk - Cash Collected"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
              />
            </div>
          </div>
        ) : paymentMethod === 'Mobile Money' ? (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Mobile Money Phone Number (MTN / Orange Cameroon) *
            </label>
            <div className="relative">
              <input
                type="tel"
                value={paymentAccount}
                onChange={(e) => onPaymentAccountChange(e.target.value)}
                placeholder="e.g. 670123456 or 690123456"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                  errors.account ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-red-100 focus:border-red-500'
                }`}
              />
              <PhoneCall className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
            </div>
            {errors.account && <p className="text-xs text-red-500 font-bold mt-1.5">{errors.account}</p>}
            <p className="text-xs text-gray-400 mt-2">
              You will receive an automated USSD prompt on your handset to authorize the {totalAmount.toLocaleString()} FCFA payment.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Account / Card Details *
            </label>
            <input
              type="text"
              value={paymentAccount}
              onChange={(e) => onPaymentAccountChange(e.target.value)}
              placeholder="e.g. 4000 1234 5678 9010"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                errors.account ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-red-100 focus:border-red-500'
              }`}
            />
            {errors.account && <p className="text-xs text-red-500 font-bold mt-1.5">{errors.account}</p>}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <span>
            {paymentMethod === 'Cash'
              ? `Confirm Terminal Cash Reservation (${totalAmount.toLocaleString()} FCFA)`
              : `Pay ${totalAmount.toLocaleString()} FCFA & Complete Reservation`}
          </span>
        </button>
      </form>

      {/* CamPay Interactive USSD Modal */}
      {showCampayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center relative space-y-5">
            {campayStatus === 'pending' && (
              <>
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Approve Payment on Phone</h3>
                  <p className="text-gray-500 text-xs mt-2">
                    A USSD prompt has been sent to your phone. Dial <span className="font-bold text-gray-800">#150*50#</span> (Orange) or check your notification (MTN) to enter your PIN.
                  </p>
                </div>
                {campayRef && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-600">
                    Ref: {campayRef}
                  </div>
                )}
              </>
            )}

            {campayStatus === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Payment Verified!</h3>
                  <p className="text-gray-500 text-xs mt-1">Generating your digital board pass...</p>
                </div>
              </>
            )}

            {campayStatus === 'failed' && (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Payment Unsuccessful</h3>
                  <p className="text-red-500 text-xs mt-1">{campayError || 'Transaction was cancelled or expired.'}</p>
                </div>
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentGatewaySelector;
