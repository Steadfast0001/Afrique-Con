import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { replayOfflineQueue, getOfflineQueue } from '../utils/offlineQueue';

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateQueueCount = () => {
      const queue = getOfflineQueue();
      setPendingCount(queue.length);
    };

    updateQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      setShowReconnected(true);
      await replayOfflineQueue();
      updateQueueCount();
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-bounce-subtle no-print">
      {!isOnline ? (
        <div className="bg-stone-900 text-amber-300 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-500/30 flex items-center gap-2.5 text-xs font-bold">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Mode Active &bull; Local changes will sync when connected</span>
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {pendingCount} queued
            </span>
          )}
        </div>
      ) : (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-400/30 flex items-center gap-2 text-xs font-bold">
          <Wifi className="w-4 h-4 text-white" />
          <span>✓ Back Online &bull; Synchronized with Afrique Con Cloud</span>
        </div>
      )}
    </div>
  );
}
