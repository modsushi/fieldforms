/**
 * Offline file storage using IndexedDB
 */

import { offlineDb } from '../offline/db';

export interface OfflineFile {
  id: string;
  file: File;
  path: string;
  uploadedUrl?: string;
  synced: boolean;
  createdAt: Date;
}

export class OfflineFileStorage {
  private static instance: OfflineFileStorage;

  private constructor() {}

  static getInstance(): OfflineFileStorage {
    if (!OfflineFileStorage.instance) {
      OfflineFileStorage.instance = new OfflineFileStorage();
    }
    return OfflineFileStorage.instance;
  }

  /**
   * Save a file for offline use
   */
  async saveFile(file: File, path: string): Promise<string> {
    const id = crypto.randomUUID();
    
    // For now, we'll store the file as a blob URL
    // In production, you'd want to store the actual file data
    const offlineFile: OfflineFile = {
      id,
      file,
      path,
      synced: false,
      createdAt: new Date(),
    };

    // Store in IndexedDB (simplified - in production use proper blob storage)
    await offlineDb.syncQueue.add({
      id: crypto.randomUUID(),
      actionType: 'create',
      entityType: 'file',
      entityId: id,
      payload: offlineFile,
      retryCount: 0,
      status: 'pending',
      createdAt: new Date(),
    });

    return id;
  }

  /**
   * Get a temporary URL for offline file
   */
  getOfflineUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Upload all pending files
   */
  async syncFiles(): Promise<void> {
    // TODO: Implement file sync with S3
    console.log('File sync not yet implemented');
  }
}

export const offlineFileStorage = OfflineFileStorage.getInstance();

