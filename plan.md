# Field Form MVP - Complete Implementation Plan

## Executive Summary

A flexible, offline-first field form solution that replaces paper-based forms for outdoor operations. Built with composable primitives to support complex workflows without rigid categorization. The system will be developed as a React/Next.js web app that can be packaged as a mobile app.

## Tech Stack

### Frontend
- **Next.js 14** with App Router - React framework with SSR/SSG
- **TypeScript** - Type safety across the stack
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - High-quality React components
- **Zustand** - State management (simpler than Redux for this use case)
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **TanStack Query** - Server state management with offline support
- **Dexie.js** - IndexedDB wrapper for offline storage
- **React DnD Kit** - Drag and drop for form builder
- **Mapbox GL JS** - Maps and location services
- **Capacitor** - Package web app as native mobile app

### Backend
- **Next.js API Routes** - Backend API
- **PostgreSQL** with **PostGIS** - Database with spatial support
- **Prisma** - Type-safe ORM with migrations
- **tRPC** - End-to-end typesafe APIs
- **Minio/S3** - File storage for images/attachments
- **BullMQ** - Job queues for async processing
- **Redis** - Caching and queue backend
- **NextAuth.js** - Authentication
- **Resend** - Email notifications
- **Zod** - Runtime validation

### Development & Deployment
- **Turborepo** - Monorepo management
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Vercel/Railway** - Deployment platform
- **Sentry** - Error tracking
- **PostHog** - Analytics

## System Architecture

### Core Primitives Design

The system is built on composable primitives rather than rigid workflow types:

```typescript
// Core primitive types that can be combined to create any workflow
type SystemPrimitives = {
  Entity: any;        // Sites, assets, equipment, locations, etc.
  Form: any;          // Data collection templates
  Workflow: any;      // Multi-step processes
  Trigger: any;       // What initiates workflows
  Action: any;        // What happens at each step
  Rule: any;          // Business logic and conditions
  Collection: any;    // Groups of related submissions
}
```

## Database Schema

```sql
-- Enable PostGIS for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Entities (polymorphic - can represent any field object)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'site', 'asset', 'equipment', 'location', etc.
  parent_id UUID REFERENCES entities(id),
  name VARCHAR(255),
  code VARCHAR(100), -- For QR/barcode scanning
  metadata JSONB DEFAULT '{}',
  geometry GEOMETRY(POINT, 4326), -- Spatial location
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Entity Relationships
CREATE TABLE entity_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_entity_id UUID REFERENCES entities(id) NOT NULL,
  target_entity_id UUID REFERENCES entities(id) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL,
  properties JSONB DEFAULT '{}',
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_to TIMESTAMP,
  UNIQUE(source_entity_id, target_entity_id, relationship_type)
);

-- Form Templates
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  version INTEGER DEFAULT 1,
  parent_template_id UUID REFERENCES form_templates(id),
  schema JSONB NOT NULL, -- Form field definitions
  variables JSONB DEFAULT '{}', -- Template variables
  computed_fields JSONB DEFAULT '{}', -- Calculated fields
  validations JSONB DEFAULT '{}', -- Validation rules
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false, -- For template marketplace
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_config JSONB NOT NULL, -- What starts the workflow
  steps JSONB NOT NULL, -- Array of step definitions
  context_schema JSONB DEFAULT '{}', -- Data passed between steps
  completion_rules JSONB DEFAULT '{}',
  scheduling JSONB DEFAULT '{}', -- For recurring workflows
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Instances (Running workflows)
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) NOT NULL,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  parent_instance_id UUID REFERENCES workflow_instances(id),
  trigger_data JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}', -- Runtime context
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, paused, completed, cancelled
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  started_by UUID REFERENCES users(id)
);

-- Workflow Step Instances
CREATE TABLE workflow_step_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_instance_id UUID REFERENCES workflow_instances(id) NOT NULL,
  step_index INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- form, decision, iterator, spawn, etc.
  step_config JSONB NOT NULL,
  assigned_to UUID[], -- Array of user IDs
  assigned_entities UUID[], -- Array of entity IDs
  status VARCHAR(50) DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id)
);

-- Collections (Groups of related submissions)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  collection_type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  entity_ids UUID[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Form Submissions
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_template_id UUID REFERENCES form_templates(id) NOT NULL,
  workflow_step_id UUID REFERENCES workflow_step_instances(id),
  entity_id UUID REFERENCES entities(id),
  collection_id UUID REFERENCES collections(id),
  data JSONB NOT NULL, -- The actual form data
  computed_data JSONB DEFAULT '{}',
  validation_status JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]', -- Array of file references
  location GEOMETRY(POINT, 4326),
  device_info JSONB DEFAULT '{}',
  offline_uuid VARCHAR(255) UNIQUE, -- For conflict resolution
  version INTEGER DEFAULT 1,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP
);

-- Markers (For location-based workflows)
CREATE TABLE markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id),
  entity_id UUID REFERENCES entities(id),
  location GEOMETRY(POINT, 4326) NOT NULL,
  marker_type VARCHAR(50),
  properties JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rules Engine
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES form_submissions(id),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Offline Sync Queue
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- create, update, delete
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  payload JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_entities_org_type ON entities(org_id, entity_type);
CREATE INDEX idx_entities_tags ON entities USING GIN(tags);
CREATE INDEX idx_entities_geometry ON entities USING GIST(geometry);
CREATE INDEX idx_form_submissions_org ON form_submissions(org_id, submitted_at DESC);
CREATE INDEX idx_form_submissions_entity ON form_submissions(entity_id);
CREATE INDEX idx_form_submissions_location ON form_submissions USING GIST(location);
CREATE INDEX idx_form_submissions_data ON form_submissions USING GIN(data);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(org_id, status);
CREATE INDEX idx_sync_queue_pending ON sync_queue(user_id, status) WHERE status = 'pending';

-- Materialized View for AI Data Lake
CREATE MATERIALIZED VIEW ai_data_lake AS
SELECT 
  fs.id as submission_id,
  fs.submitted_at,
  fs.data as form_data,
  fs.computed_data,
  ST_AsGeoJSON(fs.location) as location,
  ft.name as form_name,
  ft.schema as form_schema,
  e.entity_type,
  e.metadata as entity_metadata,
  w.name as workflow_name,
  wsi.step_config,
  c.collection_type,
  org.name as organization_name,
  u.name as submitted_by_name
FROM form_submissions fs
JOIN form_templates ft ON fs.form_template_id = ft.id
LEFT JOIN entities e ON fs.entity_id = e.id
LEFT JOIN workflow_step_instances wsi ON fs.workflow_step_id = wsi.id
LEFT JOIN workflow_instances wi ON wsi.workflow_instance_id = wi.id
LEFT JOIN workflows w ON wi.workflow_id = w.id
LEFT JOIN collections c ON fs.collection_id = c.id
JOIN organizations org ON ft.org_id = org.id
JOIN users u ON fs.submitted_by = u.id;

CREATE INDEX idx_ai_data_lake_org ON ai_data_lake(organization_name, submitted_at DESC);
```

## Type Definitions

```typescript
// src/types/core.ts

// Entity System
export interface Entity {
  id: string;
  orgId: string;
  entityType: 'site' | 'asset' | 'equipment' | 'location' | 'customer' | string;
  parentId?: string;
  name: string;
  code?: string;
  metadata: Record<string, any>;
  geometry?: GeoJSON.Point;
  tags: string[];
  isActive: boolean;
}

// Form System
export interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'datetime' | 
        'checkbox' | 'radio' | 'textarea' | 'signature' | 'photo' | 'file' |
        'location' | 'entity_selector' | 'form_selector' | 'barcode' | 'qrcode';
  label: string;
  placeholder?: string;
  helpText?: string;
  
  // Validation
  required?: boolean | ConditionalRule;
  validation?: ValidationRule[];
  
  // Dynamic behavior
  visible?: ConditionalRule;
  disabled?: ConditionalRule;
  
  // Options for select/radio
  options?: {
    source: 'static' | 'entity' | 'api' | 'previous_submission';
    value: any;
  };
  
  // Default value
  defaultValue?: {
    source: 'static' | 'context' | 'entity_property' | 'calculation';
    value: any;
  };
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  
  // Conditional visibility
  visible?: ConditionalRule;
  
  // Repeating sections
  repeatable?: {
    min?: number;
    max?: number;
    addButtonText?: string;
  };
}

export interface FormTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  version: number;
  parentTemplateId?: string;
  
  sections: FormSection[];
  
  // Dynamic field injection
  dynamicFields?: {
    source: 'entity' | 'workflow_context' | 'api';
    mapping: Record<string, string>;
  };
  
  // Computed fields
  computedFields?: Array<{
    fieldId: string;
    expression: string; // JavaScript expression
    dependencies: string[]; // Field IDs that trigger recalculation
  }>;
  
  // Template variables
  variables?: Array<{
    name: string;
    source: 'context' | 'entity' | 'user' | 'environment';
    path: string;
  }>;
}

// Workflow System
export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'entity_selection' | 'location_based' | 
        'form_submission' | 'webhook' | 'qr_scan';
  config: Record<string, any>;
}

export interface WorkflowStep {
  type: 'form' | 'entity_iterator' | 'location_capture' | 'decision' | 
        'spawn_workflow' | 'data_transform' | 'notification' | 'api_call';
  config: Record<string, any>;
  onComplete?: WorkflowStep[];
  onError?: WorkflowStep[];
}

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  contextSchema?: Record<string, any>;
  completionRules?: CompletionRule[];
}

// Rules Engine
export interface ConditionalRule {
  type: 'expression' | 'rule';
  value: string | {
    conditions: {
      all?: Condition[];
      any?: Condition[];
      not?: Condition;
    };
  };
}

export interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
           'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex';
  value: any;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value: any;
  message?: string;
}

// Submission System
export interface FormSubmission {
  id: string;
  formTemplateId: string;
  entityId?: string;
  collectionId?: string;
  workflowStepId?: string;
  data: Record<string, any>;
  computedData?: Record<string, any>;
  attachments: Attachment[];
  location?: GeoJSON.Point;
  deviceInfo?: DeviceInfo;
  submittedBy: string;
  submittedAt: Date;
  syncedAt?: Date;
  offlineUuid?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  thumbnailUrl?: string;
  localPath?: string; // For offline storage
}

// Offline Sync
export interface SyncQueueItem {
  id: string;
  actionType: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  payload: any;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}
```

## Form Builder Implementation

```typescript
// src/components/form-builder/FormBuilder.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const FormBuilder: React.FC = () => {
  const [form, setForm] = useState<FormTemplate>();
  const [selectedField, setSelectedField] = useState<FormField>();
  
  // Field palette - available field types
  const fieldTypes = [
    { type: 'text', icon: Type, label: 'Text Input' },
    { type: 'number', icon: Hash, label: 'Number' },
    { type: 'select', icon: List, label: 'Dropdown' },
    { type: 'photo', icon: Camera, label: 'Photo' },
    { type: 'signature', icon: PenTool, label: 'Signature' },
    { type: 'location', icon: MapPin, label: 'Location' },
    // ... more field types
  ];
  
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Field Palette */}
      <div className="col-span-3">
        <FieldPalette fields={fieldTypes} />
      </div>
      
      {/* Canvas */}
      <div className="col-span-6">
        <DndContext collisionDetection={closestCenter}>
          <FormCanvas form={form} onFieldSelect={setSelectedField} />
        </DndContext>
      </div>
      
      {/* Properties Panel */}
      <div className="col-span-3">
        {selectedField && (
          <FieldProperties 
            field={selectedField}
            onChange={(updated) => updateField(updated)}
          />
        )}
      </div>
    </div>
  );
};

// Field Properties Panel
export const FieldProperties: React.FC<{
  field: FormField;
  onChange: (field: FormField) => void;
}> = ({ field, onChange }) => {
  return (
    <div className="space-y-4">
      <Input
        label="Field Label"
        value={field.label}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
      />
      
      <Switch
        label="Required"
        checked={field.required as boolean}
        onChange={(checked) => onChange({ ...field, required: checked })}
      />
      
      {field.type === 'select' && (
        <OptionsEditor
          options={field.options}
          onChange={(options) => onChange({ ...field, options })}
        />
      )}
      
      <ConditionalRuleEditor
        rule={field.visible}
        fields={/* other form fields */}
        onChange={(rule) => onChange({ ...field, visible: rule })}
      />
    </div>
  );
};
```

## Workflow Engine

```typescript
// src/lib/workflow-engine/WorkflowEngine.ts
export class WorkflowEngine {
  constructor(
    private db: PrismaClient,
    private queue: Queue,
  ) {}
  
  async startWorkflow(
    workflowId: string,
    triggerData: any,
    userId: string
  ): Promise<WorkflowInstance> {
    const workflow = await this.db.workflow.findUnique({
      where: { id: workflowId }
    });
    
    // Create workflow instance
    const instance = await this.db.workflowInstance.create({
      data: {
        workflowId,
        triggerData,
        status: 'active',
        context: this.initializeContext(workflow.contextSchema),
        startedBy: userId,
        startedAt: new Date()
      }
    });
    
    // Execute first step
    await this.executeStep(instance.id, 0);
    
    return instance;
  }
  
  async executeStep(instanceId: string, stepIndex: number) {
    const instance = await this.db.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { workflow: true }
    });
    
    const stepDef = instance.workflow.steps[stepIndex];
    
    switch (stepDef.type) {
      case 'form':
        await this.executeFormStep(instance, stepIndex, stepDef);
        break;
        
      case 'entity_iterator':
        await this.executeIteratorStep(instance, stepIndex, stepDef);
        break;
        
      case 'decision':
        await this.executeDecisionStep(instance, stepIndex, stepDef);
        break;
        
      case 'spawn_workflow':
        await this.spawnChildWorkflow(instance, stepIndex, stepDef);
        break;
        
      // ... other step types
    }
  }
  
  private async executeFormStep(
    instance: WorkflowInstance,
    stepIndex: number,
    stepDef: WorkflowStep
  ) {
    // Create step instance
    const stepInstance = await this.db.workflowStepInstance.create({
      data: {
        workflowInstanceId: instance.id,
        stepIndex,
        stepType: 'form',
        stepConfig: stepDef.config,
        status: 'pending',
        assignedTo: this.determineAssignees(stepDef, instance),
        assignedEntities: this.determineEntities(stepDef, instance)
      }
    });
    
    // Notify assignees
    await this.notifyAssignees(stepInstance);
  }
  
  private async executeIteratorStep(
    instance: WorkflowInstance,
    stepIndex: number,
    stepDef: WorkflowStep
  ) {
    const entities = await this.getEntitiesForIteration(stepDef, instance);
    
    for (const entity of entities) {
      // Create child steps for each entity
      const childContext = {
        ...instance.context,
        currentEntity: entity
      };
      
      // Execute child steps
      for (const childStep of stepDef.config.childSteps) {
        await this.executeStep(instance.id, stepIndex);
      }
    }
  }
}
```

## Offline Sync System

```typescript
// src/lib/offline/OfflineManager.ts
import Dexie from 'dexie';

class OfflineDatabase extends Dexie {
  submissions: Dexie.Table<FormSubmission, string>;
  syncQueue: Dexie.Table<SyncQueueItem, string>;
  entities: Dexie.Table<Entity, string>;
  
  constructor() {
    super('FieldFormDB');
    
    this.version(1).stores({
      submissions: 'id, formTemplateId, entityId, syncedAt, [orgId+submittedAt]',
      syncQueue: 'id, status, [userId+status], createdAt',
      entities: 'id, orgId, entityType, [orgId+entityType]'
    });
  }
}

export class OfflineManager {
  private db = new OfflineDatabase();
  private syncInProgress = false;
  
  async saveSubmission(submission: FormSubmission): Promise<void> {
    // Save to IndexedDB
    await this.db.submissions.add({
      ...submission,
      offlineUuid: crypto.randomUUID(),
      syncedAt: undefined
    });
    
    // Add to sync queue
    await this.db.syncQueue.add({
      id: crypto.randomUUID(),
      actionType: 'create',
      entityType: 'submission',
      payload: submission,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date()
    });
    
    // Try to sync if online
    if (navigator.onLine) {
      this.startSync();
    }
  }
  
  async startSync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;
    
    try {
      const pendingItems = await this.db.syncQueue
        .where('status')
        .equals('pending')
        .toArray();
      
      for (const item of pendingItems) {
        await this.syncItem(item);
      }
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      // Update status
      await this.db.syncQueue.update(item.id, { status: 'processing' });
      
      // Send to server
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      
      if (response.ok) {
        // Mark as completed
        await this.db.syncQueue.update(item.id, { status: 'completed' });
        
        // Update local record
        if (item.entityType === 'submission') {
          await this.db.submissions.update(
            item.payload.id,
            { syncedAt: new Date() }
          );
        }
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      // Increment retry count
      await this.db.syncQueue.update(item.id, {
        status: 'pending',
        retryCount: item.retryCount + 1
      });
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, item.retryCount), 60000);
      setTimeout(() => this.syncItem(item), delay);
    }
  }
}

// React Hook for offline support
export function useOfflineSubmission() {
  const offlineManager = useMemo(() => new OfflineManager(), []);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineManager.startSync();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineManager]);
  
  const submitForm = useCallback(async (
    formData: any,
    formTemplateId: string
  ) => {
    const submission: FormSubmission = {
      id: crypto.randomUUID(),
      formTemplateId,
      data: formData,
      submittedAt: new Date(),
      // ... other fields
    };
    
    if (isOnline) {
      try {
        // Try online submission first
        await api.submissions.create(submission);
      } catch (error) {
        // Fall back to offline
        await offlineManager.saveSubmission(submission);
      }
    } else {
      // Save offline
      await offlineManager.saveSubmission(submission);
    }
  }, [isOnline, offlineManager]);
  
  return { submitForm, isOnline };
}
```

## API Routes (tRPC)

```typescript
// src/server/api/routers/forms.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const formsRouter = createTRPCRouter({
  // Get all form templates
  getTemplates: protectedProcedure
    .input(z.object({
      orgId: z.string(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.formTemplate.findMany({
        where: {
          orgId: input.orgId,
          category: input.category,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }),
  
  // Create form template
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      sections: z.array(z.any()), // FormSection schema
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.formTemplate.create({
        data: {
          orgId: ctx.session.user.orgId,
          name: input.name,
          description: input.description,
          schema: { sections: input.sections },
          createdBy: ctx.session.user.id,
        },
      });
    }),
  
  // Submit form
  submitForm: protectedProcedure
    .input(z.object({
      formTemplateId: z.string(),
      entityId: z.string().optional(),
      data: z.record(z.any()),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Start transaction
      return ctx.db.$transaction(async (tx) => {
        // Create submission
        const submission = await tx.formSubmission.create({
          data: {
            formTemplateId: input.formTemplateId,
            entityId: input.entityId,
            data: input.data,
            location: input.location 
              ? `POINT(${input.location.lng} ${input.location.lat})`
              : undefined,
            submittedBy: ctx.session.user.id,
          },
        });
        
        // Process attachments
        if (input.attachments?.length) {
          await tx.attachment.createMany({
            data: input.attachments.map(url => ({
              submissionId: submission.id,
              fileUrl: url,
              uploadedBy: ctx.session.user.id,
            })),
          });
        }
        
        // Trigger rules engine
        await ctx.rulesEngine.processSubmission(submission);
        
        return submission;
      });
    }),
});

// src/server/api/routers/workflows.ts
export const workflowsRouter = createTRPCRouter({
  // Start workflow
  startWorkflow: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      triggerData: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const engine = new WorkflowEngine(ctx.db, ctx.queue);
      return engine.startWorkflow(
        input.workflowId,
        input.triggerData,
        ctx.session.user.id
      );
    }),
  
  // Complete workflow step
  completeStep: protectedProcedure
    .input(z.object({
      stepInstanceId: z.string(),
      outputData: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update step instance
      const step = await ctx.db.workflowStepInstance.update({
        where: { id: input.stepInstanceId },
        data: {
          status: 'completed',
          outputData: input.outputData,
          completedAt: new Date(),
          completedBy: ctx.session.user.id,
        },
        include: { workflowInstance: true },
      });
      
      // Continue workflow
      const engine = new WorkflowEngine(ctx.db, ctx.queue);
      await engine.continueWorkflow(
        step.workflowInstanceId,
        step.stepIndex + 1
      );
      
      return step;
    }),
});
```

## Mobile App Packaging

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fieldform.app',
  appName: 'FieldForm',
  webDir: 'out', // Next.js export directory
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    Camera: {
      presentationStyle: 'popover',
      quality: 90,
    },
    Geolocation: {
      permissions: ['location'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#488AFF',
    },
  },
};

export default config;

// Native features wrapper
// src/lib/native/NativeFeatures.ts
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';

export class NativeFeatures {
  static async capturePhoto(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    
    return image.dataUrl;
  }
  
  static async getCurrentLocation(): Promise<GeolocationPosition> {
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    
    return coordinates.coords;
  }
  
  static async saveFileLocally(
    data: string,
    filename: string
  ): Promise<string> {
    const result = await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Data,
    });
    
    return result.uri;
  }
  
  static async scheduleNotification(
    title: string,
    body: string,
    scheduleAt: Date
  ): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id: Date.now(),
        schedule: { at: scheduleAt },
      }],
    });
  }
}
```

## Project Structure

```
field-form/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # React components
│   │   │   │   ├── form-builder/
│   │   │   │   ├── form-renderer/
│   │   │   │   ├── workflow-designer/
│   │   │   │   └── shared/
│   │   │   ├── lib/           # Utilities and helpers
│   │   │   │   ├── offline/
│   │   │   │   ├── workflow-engine/
│   │   │   │   └── native/
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── store/         # Zustand stores
│   │   │   └── server/        # tRPC and API
│   │   │       ├── api/
│   │   │       └── db/
│   │   └── public/
│   └── mobile/                # Capacitor mobile app
│       ├── android/
│       └── ios/
├── packages/
│   ├── database/             # Prisma schema and migrations
│   ├── types/                # Shared TypeScript types
│   └── ui/                   # Shared UI components
├── docker-compose.yml        # Local development
├── turbo.json               # Turborepo config
└── package.json
```

## MVP Timeline (8-10 weeks)

### Week 1-2: Foundation
- [ ] Set up monorepo with Turborepo
- [ ] Configure Next.js with TypeScript
- [ ] Set up PostgreSQL with PostGIS
- [ ] Configure Prisma with migrations
- [ ] Implement authentication with NextAuth
- [ ] Create basic UI components with Shadcn

### Week 3-4: Core Models
- [ ] Implement entity system
- [ ] Create form template models
- [ ] Build workflow models
- [ ] Set up tRPC routers
- [ ] Implement basic CRUD operations

### Week 5-6: Form Builder
- [ ] Create drag-and-drop form builder
- [ ] Implement field property editor
- [ ] Add conditional logic builder
- [ ] Create form preview mode
- [ ] Build form template library

### Week 7-8: Form Renderer & Submission
- [ ] Build dynamic form renderer
- [ ] Implement offline storage with Dexie
- [ ] Create photo/signature capture
- [ ] Add location services
- [ ] Build sync queue system

### Week 9-10: Workflow Engine & Polish
- [ ] Implement workflow engine
- [ ] Create workflow designer UI
- [ ] Add basic reporting dashboard
- [ ] Set up Capacitor for mobile
- [ ] Deploy to staging environment

## Go-to-Market Strategy

### Target Industries (Priority Order)
1. **Home Services** ($200B market)
   - HVAC contractors
   - Plumbers
   - Electricians
   - Pest control

2. **Property Management** ($75B market)
   - Residential property managers
   - Commercial facility managers
   - HOA management companies

3. **Small Construction** ($50B market)
   - General contractors
   - Subcontractors
   - Home builders

### Pricing Model
- **Free**: 100 submissions/month, 3 users
- **Pro**: $29/month - 1,000 submissions, unlimited users
- **Business**: $99/month - 10,000 submissions, API access
- **Enterprise**: Custom pricing

### Customer Acquisition
1. **Direct Sales** (First 10 customers)
   - Cold email local contractors
   - Offer free setup and migration
   - Get detailed feedback

2. **Content Marketing**
   - "True Cost of Paper Forms" calculator
   - YouTube tutorials by trade
   - SEO-optimized landing pages

3. **Partnerships**
   - QuickBooks integration
   - Partner with trade associations
   - White-label for consultants

### Success Metrics
- 100 beta users in first month
- 20% weekly active rate
- 50+ forms per active user/month
- 10% free-to-paid conversion
- <2% monthly churn

## AI Integration Plans

### Phase 1: Basic Analytics
- Form completion time analysis
- Field error pattern detection
- Submission anomaly detection

### Phase 2: Intelligent Assistance
- Smart field suggestions
- Auto-complete from history
- Predictive text for common responses

### Phase 3: Advanced Insights
- Natural language querying of data
- Trend analysis and predictions
- Automated report generation
- Compliance monitoring

## Competitive Advantages

1. **True offline-first** - Works for 30+ days offline
2. **Flexible primitives** - Not locked into rigid workflows  
3. **Generous free tier** - 100 submissions vs competitors' 10-20
4. **No per-user pricing** - Charge by usage, not seats
5. **Developer-friendly** - API-first, webhooks, integrations

## Risk Mitigation

### Technical Risks
- **Offline complexity**: Start with simple last-write-wins
- **Performance at scale**: Use database partitioning early
- **Cross-platform bugs**: Focus on Progressive Web App first

### Business Risks  
- **Slow adoption**: Offer free data migration
- **Support burden**: Build comprehensive docs
- **Feature creep**: Use feature flags, maintain focus

## Next Steps

1. **Validate with customers** - Interview 10 contractors
2. **Set up development environment** - PostgreSQL, Redis, S3
3. **Create design system** - Component library in Figma
4. **Build landing page** - Collect beta signups
5. **Start development** - Focus on form builder first