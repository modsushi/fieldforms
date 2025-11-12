'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useOfflineSync } from '@/store/offline-sync';
import { useEffect } from 'react';
import { syncEngine } from '@/lib/offline/sync-engine';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingCount, lastSyncAt, isSyncing, triggerSync } = useOfflineSync();

  useEffect(() => {
    // Start auto-sync when component mounts
    syncEngine.startAutoSync(30000); // Every 30 seconds

    return () => {
      syncEngine.stopAutoSync();
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null; // Don't show when online and nothing to sync
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 shadow-lg ${
        isOnline ? 'bg-blue-500' : 'bg-orange-500'
      } text-white text-sm`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            {isSyncing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Syncing...</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <span className="font-medium">{pendingCount} pending</span>
                <button
                  onClick={triggerSync}
                  className="ml-2 underline hover:no-underline"
                >
                  Sync now
                </button>
              </>
            ) : (
              <span>✓ All synced</span>
            )}
          </>
        ) : (
          <>
            <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Offline Mode</span>
            {pendingCount > 0 && (
              <span className="ml-2 font-medium">({pendingCount} pending)</span>
            )}
          </>
        )}
      </div>
      {lastSyncAt && isOnline && !isSyncing && (
        <div className="text-xs opacity-75 mt-1">
          Last sync: {lastSyncAt.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

