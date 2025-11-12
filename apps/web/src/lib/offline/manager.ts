import { offlineDb, SyncQueueItem, OfflineSubmission } from './db';
import { FormSubmission } from '@fieldform/types';

export class OfflineManager {
  private static instance: OfflineManager;

  private constructor() {}

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Save a form submission offline
   */
  async saveSubmission(submission: Omit<FormSubmission, 'id' | 'syncedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const offlineSubmission: OfflineSubmission = {
      ...submission,
      id,
      offlineCreatedAt: new Date(),
      synced: false,
    };

    await offlineDb.submissions.add(offlineSubmission);

    // Add to sync queue
    await this.addToSyncQueue({
      id: crypto.randomUUID(),
      actionType: 'create',
      entityType: 'submission',
      entityId: id,
      payload: offlineSubmission,
      retryCount: 0,
      status: 'pending',
      createdAt: new Date(),
    });

    return id;
  }

  /**
   * Get all pending submissions
   */
  async getPendingSubmissions(): Promise<OfflineSubmission[]> {
    return offlineDb.submissions
      .where('synced')
      .equals(0) // false
      .toArray();
  }

  /**
   * Mark submission as synced
   */
  async markSubmissionSynced(id: string): Promise<void> {
    await offlineDb.submissions.update(id, { synced: true });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    await offlineDb.syncQueue.add(item);
  }

  /**
   * Get pending sync queue items
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return offlineDb.syncQueue
      .where('status')
      .equals('pending')
      .toArray();
  }

  /**
   * Update sync queue item status
   */
  async updateSyncItemStatus(
    id: string,
    status: 'processing' | 'completed' | 'failed',
    processedAt?: Date
  ): Promise<void> {
    await offlineDb.syncQueue.update(id, { status, processedAt });
  }

  /**
   * Increment retry count for failed sync
   */
  async incrementRetryCount(id: string): Promise<void> {
    const item = await offlineDb.syncQueue.get(id);
    if (item) {
      await offlineDb.syncQueue.update(id, {
        retryCount: item.retryCount + 1,
        status: 'pending',
      });
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pendingCount: number;
    failedCount: number;
    totalCount: number;
  }> {
    const all = await offlineDb.syncQueue.toArray();
    return {
      pendingCount: all.filter((i) => i.status === 'pending').length,
      failedCount: all.filter((i) => i.status === 'failed').length,
      totalCount: all.length,
    };
  }

  /**
   * Clear all synced items (cleanup)
   */
  async clearSyncedItems(): Promise<void> {
    await offlineDb.submissions.where('synced').equals(1).delete();
    await offlineDb.syncQueue.where('status').equals('completed').delete();
  }
}

export const offlineManager = OfflineManager.getInstance();

