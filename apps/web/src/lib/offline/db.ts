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

export class OfflineDatabase extends Dexie {
  submissions!: Table<OfflineSubmission, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  entities!: Table<OfflineEntity, string>;
  formTemplates!: Table<any, string>;

  constructor() {
    super('FieldFormDB');

    this.version(1).stores({
      submissions: 'id, formTemplateId, entityId, offlineCreatedAt, synced',
      syncQueue: 'id, status, entityType, createdAt',
      entities: 'id, orgId, entityType, synced',
      formTemplates: 'id, orgId, name',
    });
  }
}

export const offlineDb = new OfflineDatabase();

