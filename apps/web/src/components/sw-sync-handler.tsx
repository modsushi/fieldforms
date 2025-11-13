'use client';

import { useEffect } from 'react';
import { syncEngine } from '@/lib/offline/sync-engine';
import { initializeBackgroundSync } from '@/lib/offline/background-sync';

/**
 * Service Worker Sync Handler
 *
 * This component listens for background sync messages from the service worker
 * and triggers the sync engine accordingly.
 */
export function ServiceWorkerSyncHandler() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Initialize background sync listeners
    initializeBackgroundSync();

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC') {
        console.log('📨 Received background sync request from service worker');

        // Execute sync and respond back to service worker
        syncEngine
          .sync()
          .then((result) => {
            console.log('✅ Background sync completed:', result);

            // Send result back to service worker
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({
                success: true,
                result,
              });
            }
          })
          .catch((error) => {
            console.error('❌ Background sync failed:', error);

            // Send error back to service worker
            if (event.ports && event.ports[0]) {
              event.ports[0].postMessage({
                success: false,
                error: error.message,
              });
            }
          });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
