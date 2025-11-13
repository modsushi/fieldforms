/**
 * Offline file storage using IndexedDB
 */

import { offlineDb, OfflineFile } from '../offline/db';
import { s3Client } from './s3-client';

const MAX_FILE_UPLOAD_ATTEMPTS = 5;
const MAX_FILES_PER_SYNC = 10; // Limit concurrent uploads

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
  async saveFile(file: File, path?: string): Promise<string> {
    const id = crypto.randomUUID();

    // Store the actual file data as a Blob in IndexedDB
    const offlineFile: OfflineFile = {
      id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: file,
      path,
      synced: false,
      createdAt: new Date(),
      uploadAttempts: 0,
    };

    await offlineDb.files.add(offlineFile);

    console.log(`📦 File saved offline: ${file.name} (${id})`);
    return id;
  }

  /**
   * Get a file by ID and create an object URL
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    const offlineFile = await offlineDb.files.get(fileId);

    if (!offlineFile) {
      return null;
    }

    // If already uploaded, return the uploaded URL
    if (offlineFile.uploadedUrl) {
      return offlineFile.uploadedUrl;
    }

    // Otherwise, create a temporary blob URL
    return URL.createObjectURL(offlineFile.fileData);
  }

  /**
   * Get a file object by ID
   */
  async getFile(fileId: string): Promise<OfflineFile | null> {
    const offlineFile = await offlineDb.files.get(fileId);
    return offlineFile || null;
  }

  /**
   * Get all unsynced files
   */
  async getUnsyncedFiles(): Promise<OfflineFile[]> {
    return await offlineDb.files
      .where('synced')
      .equals(0) // false = 0 in IndexedDB
      .and((file) => file.uploadAttempts < MAX_FILE_UPLOAD_ATTEMPTS)
      .toArray();
  }

  /**
   * Upload all pending files to S3
   */
  async syncFiles(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      console.log('📴 Device is offline, skipping file sync');
      return { success: 0, failed: 0 };
    }

    const unsyncedFiles = await this.getUnsyncedFiles();

    if (unsyncedFiles.length === 0) {
      console.log('✅ No files to sync');
      return { success: 0, failed: 0 };
    }

    console.log(`📤 Syncing ${unsyncedFiles.length} files...`);

    let successCount = 0;
    let failedCount = 0;

    // Process files in batches to avoid overwhelming the server
    const filesToSync = unsyncedFiles.slice(0, MAX_FILES_PER_SYNC);

    for (const offlineFile of filesToSync) {
      try {
        // Increment upload attempts
        await offlineDb.files.update(offlineFile.id, {
          uploadAttempts: offlineFile.uploadAttempts + 1,
        });

        // Create a File object from the blob
        const file = new File(
          [offlineFile.fileData],
          offlineFile.fileName,
          { type: offlineFile.fileType }
        );

        // Upload to S3
        const result = await s3Client.uploadFile(file, offlineFile.path);

        // Mark as synced and store the uploaded URL
        await offlineDb.files.update(offlineFile.id, {
          synced: true,
          uploadedUrl: result.url,
        });

        successCount++;
        console.log(`✅ Uploaded file: ${offlineFile.fileName}`);
      } catch (error) {
        console.error(`❌ Failed to upload ${offlineFile.fileName}:`, error);

        // Store the error message
        await offlineDb.files.update(offlineFile.id, {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });

        failedCount++;
      }
    }

    console.log(`✅ File sync complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }

  /**
   * Delete synced files older than a certain date
   */
  async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const oldFiles = await offlineDb.files
      .where('synced')
      .equals(1) // true = 1 in IndexedDB
      .and((file) => file.createdAt < cutoffDate)
      .toArray();

    for (const file of oldFiles) {
      await offlineDb.files.delete(file.id);
    }

    console.log(`🧹 Cleaned up ${oldFiles.length} old synced files`);
    return oldFiles.length;
  }

  /**
   * Get file sync statistics
   */
  async getStats(): Promise<{
    totalFiles: number;
    syncedFiles: number;
    pendingFiles: number;
    failedFiles: number;
    totalSize: number;
  }> {
    const allFiles = await offlineDb.files.toArray();

    const totalFiles = allFiles.length;
    const syncedFiles = allFiles.filter((f) => f.synced).length;
    const failedFiles = allFiles.filter(
      (f) => !f.synced && f.uploadAttempts >= MAX_FILE_UPLOAD_ATTEMPTS
    ).length;
    const pendingFiles = totalFiles - syncedFiles - failedFiles;
    const totalSize = allFiles.reduce((sum, f) => sum + f.fileSize, 0);

    return {
      totalFiles,
      syncedFiles,
      pendingFiles,
      failedFiles,
      totalSize,
    };
  }
}

export const offlineFileStorage = OfflineFileStorage.getInstance();

