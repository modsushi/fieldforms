import { create } from 'zustand';
import { syncEngine } from '@/lib/offline/sync-engine';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
  failedCount: number;
}

interface OfflineSyncState extends SyncStatus {
  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  updateSyncStatus: (status: Partial<SyncStatus>) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  incrementFailed: () => void;
  triggerSync: () => Promise<void>;
}

export const useOfflineSync = create<OfflineSyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  failedCount: 0,

  setOnline: (online) => {
    set({ isOnline: online });
    // Trigger sync when back online
    if (online) {
      get().triggerSync();
    }
  },
  
  setSyncing: (syncing) => set({ isSyncing: syncing }),

  updateSyncStatus: (status) => set((state) => ({ ...state, ...status })),

  incrementPending: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),

  decrementPending: () => set((state) => ({ 
    pendingCount: Math.max(0, state.pendingCount - 1),
  })),

  incrementFailed: () => set((state) => ({ failedCount: state.failedCount + 1 })),

  triggerSync: async () => {
    if (!get().isOnline || get().isSyncing) {
      return;
    }

    set({ isSyncing: true });

    try {
      const result = await syncEngine.sync();
      const stats = await syncEngine.getStatus();

      set({
        pendingCount: stats.pendingCount,
        lastSyncAt: new Date(),
      });

      console.log(`✅ Sync result: ${result.success} success, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      set({ isSyncing: false });
    }
  },
}));

