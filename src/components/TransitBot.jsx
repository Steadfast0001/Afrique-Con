import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

export default function TransitBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am TransitBot, your virtual assistant. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [unread, setUnread] = useState(true);
  const messageEndRef = useRef(null);

  const quickReplies = [
    { text: 'How do I book a ticket?', reply: 'To book a ticket, go to the Home page, select your departure and arrival stations, choose a date, and click "Search Trips". Then select your seat, enter passenger details, and confirm simulated payment.' },
    { text: 'What is the refund policy?', reply: 'You can cancel any "Pending" ticket from the "My Trips" page. Cancellations will immediately process a refund back to your mock wallet.' },
    { text: 'How to contact support?', reply: 'If you have an issue, please log in and submit a support ticket in the Support Desk or contact us at +237 6 77 12 34 56.' },
    { text: 'Check fleet status', reply: 'Our operations team keeps the fleet status updated! Standard VIP classes are currently active and running on scheduled domestic & cross-border routes.' }
  ];

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulate bot thinking and replying
    setTimeout(() => {
      let botReplyText = "Thank you for your message! Our operators are online in the Operations Console. For instant support, please use one of our quick reply buttons or submit a support ticket.";
      
      // Match keywords in user text
      const lower = textToSend.toLowerCase();
      if (lower.includes('book') || lower.includes('ticket') || lower.includes('buy')) {
        botReplyText = quickReplies[0].reply;
      } else if (lower.includes('refund') || lower.includes('cancel') || lower.includes('money')) {
        botReplyText = quickReplies[1].reply;
      } else if (lower.includes('contact') || lower.includes('number') || lower.includes('phone') || lower.includes('help')) {
        botReplyText = quickReplies[2].reply;
      } else if (lower.includes('fleet') || lower.includes('bus') || lower.includes('status')) {
        botReplyText = quickReplies[3].reply;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 850);
  };

  const handleQuickClick = (replyObj) => {
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: replyObj.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyObj.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print font-sans">
      {/* Bot Chat Window */}
      {isOpen && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl w-80 sm:w-96 h-[480px] shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-stone-950 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-stone-950/10 p-1.5 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide">TransitBot</h4>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold opacity-75 uppercase">Virtual Assistant</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-stone-950 hover:bg-stone-950/10 p-1 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-stone-950/40">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-stone-950 rounded-tr-none font-medium'
                      : 'bg-stone-800 text-stone-100 rounded-tl-none border border-stone-750'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-stone-500 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          {/* Quick Replies Panel */}
          {messages.length < 8 && (
            <div className="p-3 bg-stone-950 border-t border-stone-850/60 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickClick(reply)}
                  className="bg-stone-850 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/20 text-[10px] text-stone-300 hover:text-white px-2.5 py-1 rounded-full transition-all duration-200"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} 
            className="p-3 bg-stone-900 border-t border-stone-850 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-grow bg-stone-950 border border-stone-800 focus:border-amber-500/60 text-white rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 p-2 rounded-xl transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnread(false);
        }}
        className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2.5 font-bold text-sm relative"
        title="Chat with TransitBot"
      >
        <MessageSquare className="h-5 w-5" />
        <span>Chat with TransitBot</span>
        {unread && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-stone-900"></span>
          </span>
        )}
      </button>
    </div>
  );
}
