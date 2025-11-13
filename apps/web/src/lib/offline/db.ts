import Dexie, { Table } from 'dexie';
import { FormSubmission, Entity } from '@fieldform/types';

export interface SyncQueueItem {
  id: string;
  actionType: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  payload: any;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}

export interface OfflineSubmission extends Omit<FormSubmission, 'id'> {
  id: string;
  offlineCreatedAt: Date;
  synced: boolean;
}

export interface OfflineEntity extends Entity {
  offlineCreatedAt: Date;
  synced: boolean;
}

export interface OfflineFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: Blob;
  path?: string;
  uploadedUrl?: string;
  synced: boolean;
  createdAt: Date;
  uploadAttempts: number;
  lastError?: string;
}

export class OfflineDatabase extends Dexie {
  submissions!: Table<OfflineSubmission, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  entities!: Table<OfflineEntity, string>;
  formTemplates!: Table<any, string>;
  files!: Table<OfflineFile, string>;

  constructor() {
    super('FieldFormDB');

    // Version 1 - Original schema
    this.version(1).stores({
      submissions: 'id, formTemplateId, entityId, offlineCreatedAt, synced',
      syncQueue: 'id, status, entityType, createdAt',
      entities: 'id, orgId, entityType, synced',
      formTemplates: 'id, orgId, name',
    });

    // Version 2 - Add files table for offline file storage
    this.version(2).stores({
      submissions: 'id, formTemplateId, entityId, offlineCreatedAt, synced',
      syncQueue: 'id, status, entityType, createdAt',
      entities: 'id, orgId, entityType, synced',
      formTemplates: 'id, orgId, name',
      files: 'id, synced, createdAt, uploadAttempts',
    });
  }
}

export const offlineDb = new OfflineDatabase();

