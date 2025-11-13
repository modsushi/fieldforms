import { offlineDb, SyncQueueItem, OfflineSubmission } from './db';
import { offlineManager } from './manager';
import { offlineFileStorage } from '../storage/offline-storage';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

export class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Start automatic sync on an interval
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      console.log('⚠️ Auto-sync already running');
      return;
    }

    console.log('🔄 Starting auto-sync...');
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, intervalMs);

    // Run sync immediately
    if (navigator.onLine) {
      this.sync();
    }
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Auto-sync stopped');
    }
  }

  /**
   * Manually trigger a sync
   */
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('📴 Device is offline, skipping sync');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      console.log('🔄 Starting sync...');
      const pendingItems = await offlineManager.getPendingSyncItems();

      if (pendingItems.length === 0) {
        console.log('✅ Nothing to sync');
        return { success: 0, failed: 0 };
      }

      console.log(`📤 Syncing ${pendingItems.length} items...`);

      // Sync files first (since submissions might reference them)
      try {
        const fileResult = await offlineFileStorage.syncFiles();
        console.log(`📁 File sync: ${fileResult.success} success, ${fileResult.failed} failed`);
      } catch (error) {
        console.error('❌ File sync error:', error);
      }

      for (const item of pendingItems) {
        try {
          // Check if max retries exceeded
          if (item.retryCount >= MAX_RETRIES) {
            console.error(`❌ Max retries exceeded for ${item.id}`);
            await offlineManager.updateSyncItemStatus(item.id, 'failed', new Date());
            failedCount++;
            continue;
          }

          // Mark as processing
          await offlineManager.updateSyncItemStatus(item.id, 'processing');

          // Process based on entity type
          switch (item.entityType) {
            case 'submission':
              await this.syncSubmission(item);
              break;
            case 'entity':
              await this.syncEntity(item);
              break;
            default:
              console.warn(`Unknown entity type: ${item.entityType}`);
          }

          // Mark as completed
          await offlineManager.updateSyncItemStatus(item.id, 'completed', new Date());
          successCount++;

          console.log(`✅ Synced ${item.entityType} (${item.id})`);
        } catch (error) {
          console.error(`❌ Failed to sync ${item.id}:`, error);
          await offlineManager.incrementRetryCount(item.id);
          failedCount++;

          // Exponential backoff delay
          const delay = BASE_DELAY * Math.pow(2, item.retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      console.log(`✅ Sync complete: ${successCount} success, ${failedCount} failed`);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync a form submission
   */
  private async syncSubmission(item: SyncQueueItem): Promise<void> {
    const submission = item.payload as OfflineSubmission;

    const response = await fetch('/api/trpc/forms.createSubmission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formTemplateId: submission.formTemplateId,
        entityId: submission.entityId || null,
        data: submission.data,
        location: submission.location || null,
        metadata: submission.metadata || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    // Mark submission as synced
    if (item.entityId) {
      await offlineManager.markSubmissionSynced(item.entityId);
    }
  }

  /**
   * Sync an entity
   */
  private async syncEntity(item: SyncQueueItem): Promise<void> {
    // TODO: Implement entity sync when entity API is ready
    console.log('Entity sync not yet implemented');
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<{
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    totalCount: number;
  }> {
    const stats = await offlineManager.getSyncStats();
    return {
      isSyncing: this.isSyncing,
      ...stats,
    };
  }
}

export const syncEngine = SyncEngine.getInstance();

