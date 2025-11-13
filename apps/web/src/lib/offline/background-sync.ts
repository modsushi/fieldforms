/**
 * Background Sync Integration
 *
 * This module integrates the native Background Sync API with our existing
 * sync engine to automatically retry failed requests when connection is restored.
 */

import { syncEngine } from './sync-engine';

const SYNC_TAG = 'fieldforms-sync';

/**
 * Register background sync for automatic retry when connection is restored
 */
export async function registerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  // Check if Background Sync API is supported
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('⚠️ Background Sync API not supported, falling back to interval sync');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if sync is already registered
    const tags = await registration.sync.getTags();
    if (!tags.includes(SYNC_TAG)) {
      await registration.sync.register(SYNC_TAG);
      console.log('✅ Background sync registered');
    }
  } catch (error) {
    console.error('❌ Failed to register background sync:', error);
  }
}

/**
 * Queue a sync operation to be executed when online
 * This is a helper to trigger background sync after offline operations
 */
export async function queueBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // If online, sync immediately
    if (navigator.onLine) {
      await syncEngine.sync();
      return;
    }

    // Otherwise, register background sync to trigger when online
    await registerBackgroundSync();
  } catch (error) {
    console.error('❌ Failed to queue background sync:', error);
    // Fallback to interval-based sync
  }
}

/**
 * Initialize background sync listeners
 * This should be called once when the app initializes
 */
export function initializeBackgroundSync(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Listen for when the app comes back online
  window.addEventListener('online', async () => {
    console.log('🌐 Connection restored, triggering sync...');
    await syncEngine.sync();
  });

  // Register background sync on page load
  registerBackgroundSync();

  // Listen for visibility changes (when user returns to tab)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && navigator.onLine) {
      await syncEngine.sync();
    }
  });
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  );
}
