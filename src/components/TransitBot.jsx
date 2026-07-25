import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Bot, Headphones, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const WHATSAPP_PHONE = '237686525944';
const WHATSAPP_MESSAGE = 'Hello TransitFlow, I need assistance with my booking.';

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-11.771c.207-.586.277-1.016.084-1.348-.069-.117-.253-.188-.53-.328-.277-.14-1.637-.808-1.89-1.002-.253-.194-.437-.291-.621.01-.184.301-.713.899-.874 1.085-.162.186-.323.21-.6.07-.277-.14-1.171-.432-2.23-1.378-.824-.735-1.38-1.642-1.542-1.921-.162-.279-.017-.43.122-.569.124-.125.277-.323.415-.483.139-.161.185-.274.277-.456.093-.182.046-.341-.023-.482-.069-.14-.621-1.498-.85-2.05-.223-.538-.447-.465-.621-.474-.162-.008-.346-.009-.53-.009-.184 0-.484.069-.737.348-.253.279-.966.944-.966 2.303s.99 2.669 1.129 2.855c.138.186 1.948 2.974 4.72 4.169.659.283 1.174.453 1.576.58.662.21 1.264.18 1.74.109.53-.08 1.637-.669 1.868-1.317zm0 0" />
  </svg>
);

export default function TransitBot() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [isTawkLoaded, setIsTawkLoaded] = useState(false);

  // Dynamic tawk.to Script loading
  useEffect(() => {
    let script = document.getElementById('tawk-script');
    
    const initializeTawkAPI = () => {
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_API.onLoad = function () {
        setIsTawkLoaded(true);
        if (typeof window.Tawk_API.hideWidget === 'function') {
          window.Tawk_API.hideWidget();
        }
      };

      window.Tawk_API.onChatMinimized = function () {
        if (typeof window.Tawk_API.hideWidget === 'function') {
          window.Tawk_API.hideWidget();
        }
      };

      // Check if it's already loaded in the window instance
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
        setIsTawkLoaded(true);
        window.Tawk_API.hideWidget();
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = 'tawk-script';
      script.async = true;
      script.src = 'https://embed.tawk.to/6a58ca6ab7e1ee1d4a16cf84/1jtlddcft';
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');

      initializeTawkAPI();

      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    } else {
      initializeTawkAPI();
    }
  }, []);

  const handleOpenTawk = () => {
    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      setIsOpen(false);
      try {
        window.Tawk_API.showWidget();
        window.Tawk_API.maximize();
      } catch (err) {
        console.error("Failed to open tawk.to chat widget:", err);
      }
    } else {
      alert(language === 'fr' ? "Le chat d'assistance se charge. Veuillez réessayer dans un instant." : "Support chat is loading. Please try again in a moment.");
    }
  };

  const handleOpenWhatsApp = () => {
    setIsOpen(false);
    const phone = WHATSAPP_PHONE;
    const text = encodeURIComponent(WHATSAPP_MESSAGE);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print font-sans">
      {/* Support Popover Menu */}
      {isOpen && (
        <div className="bg-stone-900 border border-stone-850 rounded-2xl w-80 sm:w-[360px] shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-stone-950 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-stone-950/10 p-1.5 rounded-lg">
                <Headphones className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide">{t('bot.supportOptions')}</h4>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold opacity-75 uppercase">{t('bot.statusOnline')}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-stone-950 hover:bg-stone-950/10 p-1.5 rounded-lg transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Body Options */}
          <div className="p-4 space-y-3 bg-stone-950/40">
            {/* Live Chat Option */}
            <button
              onClick={handleOpenTawk}
              className="w-full text-left bg-stone-850 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3.5 transition-all duration-200 group"
            >
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl group-hover:bg-amber-500 group-hover:text-stone-950 transition-all duration-200">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold tracking-wide group-hover:text-amber-400 transition-colors">
                  {t('bot.liveChat')}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                  {t('bot.liveChatDesc')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* WhatsApp Option */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full text-left bg-stone-850 hover:bg-stone-800 border border-stone-800 hover:border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3.5 transition-all duration-200 group"
            >
              <div className="bg-emerald-500/10 text-emerald-500 p-2.5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-200">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold tracking-wide group-hover:text-emerald-400 transition-colors">
                  {t('bot.whatsappChat')}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                  {t('bot.whatsappChatDesc')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-stone-500 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setUnread(false);
        }}
        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2.5 font-bold text-sm relative"
        title="Chat Support"
      >
        <MessageSquare className="h-5 w-5" />
        <span>
          {t('bot.needHelp')}
        </span>
        {unread && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-50 border border-stone-900"></span>
          </span>
        )}
      </button>
    </div>
  );
}
