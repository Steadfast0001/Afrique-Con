import React from 'react';
import { Link } from 'react-router-dom';

export default function SupportDesk() {
  const tickets = [
    { id: 'SUP-001', name: 'Jean-Paul Nkomo', issue: 'Seat selection issue on booking TH-28471001', time: '2 hours ago', status: 'open' },
    { id: 'SUP-002', name: 'Fatou Bello', issue: 'Requesting refund for cancelled trip', time: '5 hours ago', status: 'in-progress' },
    { id: 'SUP-003', name: 'Emmanuel Okafor', issue: 'Border crossing documentation query', time: '1 day ago', status: 'resolved' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Support Desk</h2>
        <p className="text-gray-400 text-sm mt-1">Handle passenger inquiries and support requests</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {tickets.map((ticket, i) => (
          <div key={ticket.id} className={`px-6 py-5 ${i < tickets.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 transition-colors flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
                {ticket.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{ticket.name}</p>
                <p className="text-gray-600 text-sm mt-0.5">{ticket.issue}</p>
                <p className="text-gray-400 text-xs mt-1">{ticket.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                ticket.status === 'open' ? 'bg-red-50 text-red-600 border border-red-200'
                : ticket.status === 'in-progress' ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {ticket.status}
              </span>
              <button className="text-gray-400 hover:text-gray-600 text-xs font-semibold transition-colors">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
