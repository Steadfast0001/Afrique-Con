import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Trash2, 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Plus, 
  X, 
  ExternalLink,
  ShieldCheck,
  User,
  Ticket,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    title: 'Seat Change Confirmed',
    text: 'Hello {name}, your seat modification request for booking ref {ref} has been approved and updated. You can view your refreshed boarding pass at any time.'
  },
  {
    title: 'Refund Approved via MoMo',
    text: 'Dear {name}, your refund request for booking ref {ref} has been verified and approved by our billing department. Funds will reflect in your Mobile Money wallet within 2-4 hours.'
  },
  {
    title: 'Cross-Border Travel Docs',
    text: 'Dear {name}, for your international cross-border trip to {dest}, please ensure you present a valid International Passport or ECOWAS Travel Certificate along with Yellow Fever vaccination proof at departure terminal.'
  },
  {
    title: 'Luggage Allowance Policy',
    text: 'Hello {name}, each passenger is entitled to 1 standard carry-on and up to 2 checked luggage bags (max 30kg combined) free of charge on all Afrique Con coaches.'
  },
  {
    title: 'Terminal Arrival Time',
    text: 'Hello {name}, please arrive at the departure terminal at least 30 minutes prior to departure for luggage check-in, seat boarding verification, and passenger manifest clearance.'
  }
];

export default function SupportDesk() {
  const { supportTickets, updateTicketStatus, replySupportTicket, deleteSupportTicket, deleteSupportTickets, currentUser } = useApp();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyChannel, setReplyChannel] = useState('WhatsApp'); // 'WhatsApp', 'Email', 'In-App'
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bookingRef: '',
    category: 'General',
    priority: 'medium',
    subject: '',
    message: ''
  });

  // Filter & Search
  const filtered = supportTickets
    .filter(t => filter === 'all' ? true : t.status?.toLowerCase() === filter.toLowerCase())
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.id?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.customerPhone?.includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.bookingRef?.toLowerCase().includes(q)
      );
    });

  const allFilteredIds = filtered.map(t => t.id);
  const isAllSelected = filtered.length > 0 && filtered.every(t => selectedIds.includes(t.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (window.confirm(`Delete ${count} selected support ticket${count > 1 ? 's' : ''}?`)) {
      setIsProcessing(true);
      try {
        if (typeof deleteSupportTickets === 'function') {
          await deleteSupportTickets(selectedIds);
        } else {
          for (const id of selectedIds) {
            await deleteSupportTicket(id);
          }
        }
        setSelectedIds([]);
        if (activeTicket && selectedIds.includes(activeTicket.id)) {
          setActiveTicket(null);
        }
      } catch (err) {
        alert(`Failed to delete tickets: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBatchUpdateStatus = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        await updateTicketStatus(id, newStatus);
      }
      setSelectedIds([]);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleDelete = async (ticket) => {
    if (window.confirm(`Delete ticket #${ticket.id} from ${ticket.customerName}?`)) {
      try {
        await deleteSupportTicket(ticket.id);
        setSelectedIds(prev => prev.filter(id => id !== ticket.id));
        if (activeTicket?.id === ticket.id) setActiveTicket(null);
      } catch (err) {
        alert(err.message || 'Failed to delete ticket.');
      }
    }
  };

  // Communications handlers
  const handleApplyTemplate = (template) => {
    if (!activeTicket) return;
    const filled = template.text
      .replace(/{name}/g, activeTicket.customerName || 'Valued Passenger')
      .replace(/{ref}/g, activeTicket.bookingRef || 'your booking')
      .replace(/{dest}/g, 'Nigeria');
    setReplyText(filled);
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    setIsProcessing(true);
    const msg = replyText.trim();

    try {
      // 1. Record reply in application history
      if (typeof replySupportTicket === 'function') {
        await replySupportTicket(activeTicket.id, msg, replyChannel);
      }

      // 2. Dispatch across selected communication channel
      if (replyChannel === 'WhatsApp') {
        const phone = (activeTicket.customerPhone || '').replace(/[^0-9]/g, '');
        const normalizedPhone = phone.startsWith('237') ? phone : phone.startsWith('234') ? phone : ('237' + phone);
        const formattedMsg = `🚌 *AFRIQUE CON / TRANSITFLOW SUPPORT DESK*\n\n` +
          `Hello *${activeTicket.customerName}*,\n` +
          `Regarding Support Ticket *#${activeTicket.id}* (${activeTicket.subject}):\n\n` +
          `${msg}\n\n` +
          `_Agent: ${currentUser?.name || 'Customer Care Team'}_ &bull; _Afrique Con Transit Hub_`;
        
        window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(formattedMsg)}`, '_blank');
      } else if (replyChannel === 'Email') {
        const email = activeTicket.customerEmail || '';
        const subject = `[Afrique Con Support #${activeTicket.id}] Re: ${activeTicket.subject}`;
        const body = `Dear ${activeTicket.customerName},\n\n${msg}\n\nBest regards,\n${currentUser?.name || 'Afrique Con Support Team'}\nAfrique Con Express Transit`;
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      }

      // Update active ticket state locally
      setActiveTicket(prev => ({
        ...prev,
        status: prev.status === 'open' ? 'in-progress' : prev.status,
        replies: [
          ...(prev.replies || []),
          {
            id: `rep-${Date.now()}`,
            sender: 'agent',
            senderName: currentUser?.name || 'Support Desk Agent',
            text: msg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            channel: replyChannel
          }
        ]
      }));

      setReplyText('');
    } catch (err) {
      alert(`Failed to send reply: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectWhatsApp = (ticket) => {
    const phone = (ticket.customerPhone || '').replace(/[^0-9]/g, '');
    const normalizedPhone = phone.startsWith('237') ? phone : phone.startsWith('234') ? phone : ('237' + phone);
    const msg = `🚌 *AFRIQUE CON CUSTOMER SUPPORT*\n\n` +
      `Hello ${ticket.customerName}, this is regarding your ticket #${ticket.id} (${ticket.subject}). How can we assist you today?`;
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDirectCall = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Customer Support & Dispatch Desk</h2>
              <p className="text-gray-400 text-xs font-medium">Communicate directly with passengers via WhatsApp, Email, and in-app feeds</p>
            </div>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'open', 'in-progress', 'resolved', 'closed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Bulk Action Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket ref, customer name, phone, booking..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-red-400"
          />
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end animate-fade-in">
            <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {selectedIds.length} Selected
            </span>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBatchUpdateStatus('resolved')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              Mark Resolved
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleBatchUpdateStatus('closed')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              Mark Closed
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-gray-400 hover:text-gray-700 px-2 py-1 text-xs font-semibold"
            >
              Deselect All
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 font-medium">
            Total <strong className="text-gray-700">{filtered.length}</strong> inquiries in queue
          </div>
        )}
      </div>

      {/* Main Grid: Ticket List (Left 7 cols) & Live Conversation Suite (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Tickets Table & Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-red-600" />
                  ) : isSomeSelected ? (
                    <MinusSquare className="w-4 h-4 text-red-500" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                  )}
                </button>
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Passenger Inquiries</span>
              </div>
              <span className="text-xs text-gray-400 font-semibold">{filtered.length} items</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map(ticket => {
                const isSelected = selectedIds.includes(ticket.id);
                const isActive = activeTicket?.id === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`p-4 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActive 
                        ? 'bg-red-50/80 border-l-4 border-red-500 shadow-inner' 
                        : isSelected 
                        ? 'bg-red-50/30' 
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectRow(ticket.id);
                        }}
                        className="mt-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-red-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>

                      <div className="w-9 h-9 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center font-black text-xs flex-shrink-0 border border-gray-200">
                        {ticket.customerName ? ticket.customerName.charAt(0) : 'U'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-gray-900 text-xs truncate max-w-[150px]">{ticket.customerName}</span>
                          <span className="font-mono text-[10px] font-bold text-red-600">{ticket.id}</span>
                          {ticket.bookingRef && (
                            <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                              {ticket.bookingRef}
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-gray-800 text-xs mt-1 truncate">{ticket.subject}</p>
                        <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">{ticket.message}</p>

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-medium">
                          <span>{ticket.date}</span>
                          <span>&bull;</span>
                          <span className="text-gray-600 font-semibold">{ticket.customerPhone || ticket.customerEmail || 'No contact'}</span>
                          {ticket.replies?.length > 0 && (
                            <>
                              <span>&bull;</span>
                              <span className="text-blue-600 font-bold flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> {ticket.replies.length} replies
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ticket.status === 'open'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : ticket.status === 'in-progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {ticket.status}
                      </span>

                      <div className="flex items-center gap-1">
                        {ticket.customerPhone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectWhatsApp(ticket);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <span className="text-xs">💬</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDelete(ticket);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">
                  No support inquiries matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live Conversation & Multi-Channel Communicator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeTicket ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-lg relative flex flex-col h-full min-h-[580px] animate-slide-up">
              
              {/* Ticket Top Profile */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 text-sm capitalize">{activeTicket.customerName}</h3>
                      <span className="text-[10px] font-mono font-bold text-red-600">{activeTicket.id}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{activeTicket.customerEmail || 'No email registered'}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeTicket.customerPhone && (
                      <button
                        type="button"
                        onClick={() => handleDirectWhatsApp(activeTicket)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-emerald-200"
                        title="Open WhatsApp chat"
                      >
                        <span>💬 WhatsApp</span>
                      </button>
                    )}
                    {activeTicket.customerPhone && (
                      <button
                        type="button"
                        onClick={() => handleDirectCall(activeTicket.customerPhone)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all text-xs border border-blue-200"
                        title="Direct telephone call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs">
                  <span className="text-gray-400 font-bold">Ticket Status:</span>
                  <div className="flex items-center gap-1">
                    {['open', 'in-progress', 'resolved', 'closed'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateTicketStatus(activeTicket.id, st)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                          activeTicket.status === st
                            ? 'bg-red-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Thread Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[260px]">
                
                {/* Original Customer Inquiry */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                    <span className="text-gray-700 font-bold">{activeTicket.customerName} (Customer)</span>
                    <span>{activeTicket.date}</span>
                  </div>
                  <p className="font-extrabold text-gray-900 text-xs">{activeTicket.subject}</p>
                  <p className="text-gray-700 leading-relaxed">{activeTicket.message}</p>
                </div>

                {/* Agent Replies Thread */}
                {(activeTicket.replies || []).map((reply, i) => (
                  <div 
                    key={reply.id || i} 
                    className={`rounded-2xl p-3 text-xs space-y-1 ${
                      reply.sender === 'agent' 
                        ? 'bg-red-50/70 border border-red-200 ml-4' 
                        : 'bg-gray-50 border border-gray-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-red-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {reply.senderName || 'Support Agent'}
                      </span>
                      <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                        <span className="bg-white/80 px-1 rounded text-[9px] font-bold text-gray-600 border border-gray-200">{reply.channel || 'In-App'}</span>
                        <span>{reply.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed">{reply.text}</p>
                  </div>
                ))}
              </div>

              {/* Quick Template Chips */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mb-1.5">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  <span>Quick Response Templates:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2 py-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 border border-gray-200 rounded-lg whitespace-nowrap transition-all font-semibold"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Composer */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Dispatch Response Via:</span>
                  <div className="flex items-center gap-1">
                    {['WhatsApp', 'Email', 'In-App'].map(ch => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setReplyChannel(ch)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          replyChannel === ch 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {ch === 'WhatsApp' ? '💬 WhatsApp' : ch === 'Email' ? '✉️ Email' : 'Portal Feed'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type your response to ${activeTicket.customerName}...`}
                    className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-red-400 focus:bg-white rounded-2xl text-xs font-semibold text-gray-900 focus:outline-none resize-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    disabled={isProcessing || !replyText.trim()}
                    onClick={handleSendReply}
                    className="absolute right-2.5 bottom-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send & Dispatch</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 flex flex-col items-center justify-center min-h-[580px]">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-3 animate-pulse" />
              <p className="font-extrabold text-sm text-gray-700">No Ticket Selected</p>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                Select any passenger inquiry from the left queue to view the full conversation history and respond via WhatsApp or Email.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
