import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      // Hide the "Back online" message after 3 seconds
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div 
        className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border font-bold text-sm transition-all ${
          !isOnline 
            ? 'bg-red-500 text-white border-red-600 shadow-red-500/30' 
            : 'bg-green-500 text-white border-green-600 shadow-green-500/30'
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-5 h-5 animate-pulse" />
            <span>You are currently offline</span>
          </>
        ) : (
          <>
            <Wifi className="w-5 h-5" />
            <span>Connection restored</span>
          </>
        )}
      </div>
    </div>
  );
}
