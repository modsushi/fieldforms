'use client';

import { useState, useEffect } from 'react';
import { useOfflineSync } from '@/store/offline-sync';

export function useOnlineStatus() {
  const { isOnline, setOnline } = useOfflineSync();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleOnline = () => {
      setOnline(true);
      console.log('🟢 Back online!');
    };

    const handleOffline = () => {
      setOnline(false);
      console.log('🔴 Offline mode');
    };

    // Set initial state
    setOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // Avoid hydration mismatch
  if (!mounted) {
    return true;
  }

  return isOnline;
}

