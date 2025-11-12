# FieldForm Backend Architecture & API Documentation

## Overview

FieldForm is a flexible, no-code field form builder with a powerful workflow engine designed for outdoor operations and field work. The system enables organizations to create dynamic forms, assign work to teams, and execute complex multi-step workflows.

---

## Core Concepts

### 1. Form Templates

**What is a Form Template?**

A Form Template is a reusable form definition that specifies:
- Form structure (sections and fields)
- Field types and validations
- Conditional logic
- Computed fields
- Default values

**Structure:**
```typescript
{
  id: string;
  name: string;
  description?: string;
  category?: string;
  version: number;
  schema: {
    sections: [
      {
        id: string;
        title: string;
        description?: string;
        fields: [
          {
            id: string;
            type: "text" | "number" | "select" | "checkbox" | 
                  "radio" | "date" | "datetime" | "textarea" |
                  "file" | "photo" | "location" | "signature";
            label: string;
            description?: string;
            required: boolean;
            defaultValue?: any;
            validation?: {
              min?: number;
              max?: number;
              pattern?: string;
              message?: string;
            };
            options?: {
              source: "static" | "entity" | "api";
              value: Array<{label: string, value: string}> | string;
            };
            conditionalLogic?: {
              show: boolean;
              when: string; // field id
              is: "equals" | "contains" | "greater_than" | "less_than";
              value: any;
            };
          }
        ];
      }
    ];
  };
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  organizationId: string;
}
```

**Use Cases:**
- Site inspection checklists
- Equipment maintenance forms
- Customer feedback surveys
- Incident reports
- Safety audits
- Asset registration

---

### 2. Work Orders

**What is a Work Order?**

A Work Order is an assigned task that executes a workflow. It represents a unit of work that needs to be completed by a team or operator.

**Structure:**
```typescript
{
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  
  // Assignment
  assignedToTeamId?: string;
  claimedById?: string; // Operator who claimed it
  
  // Workflow
  workflowId: string;
  currentStepIndex: number;
  
  // Scheduling
  dueDate?: Date;
  completedAt?: Date;
  
  // Tracking
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  workflow: Workflow;
  assignedToTeam?: Team;
  claimedBy?: User;
  steps: WorkOrderStep[];
  submissions: FormSubmission[];
}
```

**Work Order Lifecycle:**
```
1. PENDING (Created, assigned to team)
   ↓
2. IN_PROGRESS (Claimed by operator, work started)
   ↓
3. COMPLETED (All steps finished)
   ↓
4. Reports Generated (PDF/CSV)
```

**Alternative Flow:**
```
PENDING → CANCELLED (Work order cancelled)
```

---

### 3. Workflows

**What is a Workflow?**

A Workflow defines a sequence of steps that operators must complete. Each step can be a form to fill, a conditional branch, iteration over multiple items, or location-based tasks.

**Structure:**
```typescript
{
  id: string;
  name: string;
  description?: string;
  definition: {
    version: "1.0";
    steps: WorkflowStep[];
    metadata?: {
      estimatedDuration: number; // minutes
      requiredCapabilities: string[]; // e.g., ["camera", "gps"]
      tags: string[];
    };
  };
  isActive: boolean;
  createdBy: string;
  organizationId: string;
}
```

---

## Workflow Step Primitives

FieldForm provides 4 powerful workflow step types that can be combined to create complex workflows:

### 1. Form Step

**Purpose:** Fill a single form, optionally linked to an entity (site, asset, equipment).

**Use Case Examples:**
- Complete inspection form for a specific site
- Record equipment maintenance details
- Capture customer feedback
- Document incident details

**Configuration:**
```typescript
{
  type: "form";
  id: "step-1";
  name: "Site Inspection";
  description: "Complete the site inspection checklist";
  config: {
    formTemplateId: "form-template-id";
    entityId?: "site-123"; // Optional: link to specific entity
    allowMultiple: false; // Allow multiple submissions of same form
    minimumSubmissions?: 1;
  };
}
```

**Example Workflow:**
```
Work Order: "Building A Inspection"
  └─ Form Step: Fill "Safety Inspection Checklist"
     - Linked to Entity: "Building A"
```

---

### 2. Conditional Step

**Purpose:** Branch the workflow based on previous form responses.

**Use Case Examples:**
- **Corrective Maintenance:** "What type of issue?" → Route to appropriate repair form
- **Risk Assessment:** High risk → Require supervisor approval form, Low risk → Continue
- **Quality Check:** Failed → Rework form, Passed → Continue

**Configuration:**
```typescript
{
  type: "conditional";
  id: "step-2";
  name: "Route Based on Issue Type";
  config: {
    sourceStepId: "step-1"; // Previous step to evaluate
    fieldId: "issue_type"; // Field to check
    branches: [
      {
        condition: {
          operator: "equals";
          value: "electrical";
        };
        nextSteps: [
          // Steps for electrical issues
          { type: "form", config: { formTemplateId: "electrical-repair-form" } }
        ];
      },
      {
        condition: {
          operator: "equals";
          value: "plumbing";
        };
        nextSteps: [
          // Steps for plumbing issues
          { type: "form", config: { formTemplateId: "plumbing-repair-form" } }
        ];
      }
    ];
    defaultBranch: [
      // Default if no conditions match
      { type: "form", config: { formTemplateId: "general-repair-form" } }
    ];
  };
}
```

**Supported Operators:**
- `equals` - Exact match
- `contains` - String contains
- `greater_than` - Numeric comparison
- `less_than` - Numeric comparison
- `in` - Value in array
- `not_in` - Value not in array

**Example Workflow:**
```
Work Order: "Maintenance Request"
  ├─ Form Step: "Initial Assessment"
  │  └─ Field: "issue_type" (electrical/plumbing/hvac)
  │
  └─ Conditional Step: Route by issue type
     ├─ If electrical → "Electrical Repair Form"
     ├─ If plumbing → "Plumbing Repair Form"
     └─ If hvac → "HVAC Service Form"
```

---

### 3. Iterator Step

**Purpose:** Repeat workflow steps for multiple items (sites, assets, equipment).

**Use Case Examples:**
- **Inspective Type:** Inspect same checklist for 10 different sites
- **Multi-Asset Maintenance:** Service each piece of equipment in a building
- **Route Inspection:** Visit each waypoint and complete form
- **Inventory Count:** Count items at multiple locations

**Configuration:**
```typescript
{
  type: "iterator";
  id: "step-3";
  name: "Inspect All Selected Sites";
  config: {
    sourceType: "entities" | "manual_list" | "field_value";
    
    // For entities source
    entityType: "site";
    entityIds: ["site-1", "site-2", "site-3"]; // Pre-selected
    // OR dynamic query:
    entityQuery: {
      filters: { region: "north" };
      tags: ["inspection-required"];
    };
    
    // For field_value source (from previous form)
    fieldSource: {
      stepId: "step-1";
      fieldId: "selected_sites"; // User selected sites in previous form
    };
    
    // For manual_list
    items: [
      { id: "1", label: "Floor 1", metadata: { floor: 1 } },
      { id: "2", label: "Floor 2", metadata: { floor: 2 } }
    ];
    
    // Steps to repeat per item
    steps: [
      {
        type: "form";
        config: { formTemplateId: "site-inspection-form" };
      }
    ];
    
    allowSkip: false; // Can operator skip items?
    requireAll: true; // Must complete all items?
  };
}
```

**Example Workflow:**
```
Work Order: "Multi-Site Safety Inspection"
  ├─ Form Step: "Select Sites to Inspect"
  │  └─ Field: "sites" (multi-select of entities)
  │
  └─ Iterator Step: For each selected site
     └─ Form Step: "Safety Inspection Checklist"
        - Context: Current site
        - Progress: "Site 2 of 5"
```

**Progress Tracking:**
- Shows current item: "Processing Site 2 of 10"
- Displays completed items
- Allows navigation between items
- Batch completion status

---

### 4. Location Marker Step

**Purpose:** Drop pins on a map and fill a form for each marker.

**Use Case Examples:**
- **Survey Type:** Drop markers at observation points, fill survey form per marker
- **Defect Marking:** Mark locations of defects with photos and descriptions
- **Asset Mapping:** Place markers for new asset locations
- **Hazard Identification:** Mark hazardous areas with details

**Configuration:**
```typescript
{
  type: "location-marker";
  id: "step-4";
  name: "Mark Observation Points";
  config: {
    minMarkers: 1;
    maxMarkers: 50;
    formTemplateId: "observation-form"; // Form per marker
    
    // Map settings
    mapCenter: { lat: 37.7749, lng: -122.4194 };
    mapZoom: 15;
    allowedArea: {
      type: "Polygon";
      coordinates: [/* GeoJSON polygon */];
    }; // Optional boundary
    
    // Marker settings
    markerType: "observation";
    allowPhotos: true;
    requireDescription: true;
  };
}
```

**Example Workflow:**
```
Work Order: "Field Survey"
  └─ Location Marker Step: "Drop observation markers"
     - User drops pins on map
     - For each pin:
       └─ Form: "Observation Details"
          - Photo (required)
          - Description
          - Category
```

**UI Features:**
- Interactive map (Mapbox/Leaflet)
- Drag-and-drop markers
- Marker clustering for many points
- Form popup per marker
- Review all markers before completion
- Export markers as GeoJSON

---

## Real-World Workflow Examples

### Example 1: Corrective Maintenance Workflow

**Scenario:** Handle different types of repair requests

```typescript
{
  name: "Corrective Maintenance",
  steps: [
    // Step 1: Initial Assessment
    {
      type: "form",
      name: "Issue Assessment",
      config: {
        formTemplateId: "issue-assessment-form"
        // Fields: issue_type, severity, description
      }
    },
    
    // Step 2: Route based on issue type
    {
      type: "conditional",
      name: "Route to Specialist",
      config: {
        sourceStepId: "step-1",
        fieldId: "issue_type",
        branches: [
          {
            condition: { operator: "equals", value: "electrical" },
            nextSteps: [{
              type: "form",
              config: { formTemplateId: "electrical-repair-form" }
            }]
          },
          {
            condition: { operator: "equals", value: "plumbing" },
            nextSteps: [{
              type: "form",
              config: { formTemplateId: "plumbing-repair-form" }
            }]
          }
        ]
      }
    },
    
    // Step 3: Final verification
    {
      type: "form",
      name: "Completion Verification",
      config: {
        formTemplateId: "verification-form"
      }
    }
  ]
}
```

### Example 2: Multi-Site Inspection Workflow

**Scenario:** Inspect multiple sites with same checklist

```typescript
{
  name: "Multi-Site Monthly Inspection",
  steps: [
    // Step 1: Select sites
    {
      type: "form",
      name: "Select Sites",
      config: {
        formTemplateId: "site-selection-form"
        // Field: "selected_sites" (multi-select entity picker)
      }
    },
    
    // Step 2: Iterate over sites
    {
      type: "iterator",
      name: "Inspect Each Site",
      config: {
        sourceType: "field_value",
        fieldSource: {
          stepId: "step-1",
          fieldId: "selected_sites"
        },
        steps: [
          {
            type: "form",
            name: "Site Inspection",
            config: {
              formTemplateId: "monthly-inspection-checklist"
            }
          }
        ],
        requireAll: true
      }
    },
    
    // Step 3: Summary report
    {
      type: "form",
      name: "Inspection Summary",
      config: {
        formTemplateId: "summary-report-form"
      }
    }
  ]
}
```

### Example 3: Field Survey Workflow

**Scenario:** Survey area by dropping markers with observations

```typescript
{
  name: "Environmental Survey",
  steps: [
    // Step 1: Survey area selection
    {
      type: "form",
      name: "Survey Planning",
      config: {
        formTemplateId: "survey-plan-form"
      }
    },
    
    // Step 2: Drop observation markers
    {
      type: "location-marker",
      name: "Mark Observation Points",
      config: {
        minMarkers: 5,
        maxMarkers: 50,
        formTemplateId: "observation-form",
        allowPhotos: true,
        markerType: "observation"
      }
    },
    
    // Step 3: Survey completion
    {
      type: "form",
      name: "Survey Summary",
      config: {
        formTemplateId: "survey-summary-form"
      }
    }
  ]
}
```

---

## Data Models & Relationships

### Entity Relationship Diagram

```
Organization
  ├── Users (SUPERVISOR | OPERATOR)
  ├── Teams
  │   └── Members (Users with OPERATOR role)
  ├── Form Templates
  ├── Workflows
  ├── Work Orders
  │   ├── Assigned to Team
  │   ├── Claimed by Operator
  │   ├── Steps (WorkOrderStep[])
  │   └── Submissions (FormSubmission[])
  └── Entities (Sites, Assets, Equipment)
```

### Key Models

#### User
```typescript
{
  id: string;
  email: string;
  name: string;
  role: "SUPERVISOR" | "OPERATOR";
  teamId?: string;
  organizationId: string;
}
```

#### Team
```typescript
{
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  members: User[];
  workOrders: WorkOrder[];
}
```

#### Entity
```typescript
{
  id: string;
  entityType: string; // "site", "asset", "equipment", "vehicle", etc.
  name: string;
  code?: string; // For QR/barcode
  metadata: Record<string, any>;
  geometry?: string; // WKT format (Point, Polygon, etc.)
  tags: string[];
  parentId?: string; // Hierarchical relationships
  organizationId: string;
}
```

#### FormSubmission
```typescript
{
  id: string;
  formTemplateId: string;
  workOrderId?: string;
  workOrderStepId?: string;
  entityId?: string; // Linked entity if form is entity-specific
  data: Record<string, any>; // Form field values
  location?: string; // Submission location (WKT)
  deviceInfo: {
    deviceId: string;
    platform: string;
    osVersion: string;
  };
  offlineUuid?: string; // For offline sync
  submittedBy: string;
  submittedAt: Date;
}
```

---

## API Structure (tRPC)

### Authentication
All API endpoints require authentication except `/api/auth/*`

### Available Routers

#### 1. Forms Router (`trpc.forms.*`)

**Get all templates**
```typescript
forms.getTemplates()
// Returns: FormTemplate[]
```

**Get single template**
```typescript
forms.getTemplate({ id: string })
// Returns: FormTemplate
```

**Create template** (Supervisor only)
```typescript
forms.createTemplate({
  name: string;
  description?: string;
  schema: FormSchema;
})
// Returns: FormTemplate
```

**Submit form**
```typescript
forms.submitForm({
  formTemplateId: string;
  workOrderId?: string;
  entityId?: string;
  data: Record<string, any>;
  location?: { lat: number; lng: number };
  deviceInfo: DeviceInfo;
})
// Returns: FormSubmission
```

**Get submissions**
```typescript
forms.getSubmissions({
  formTemplateId?: string;
  workOrderId?: string;
  startDate?: Date;
  endDate?: Date;
})
// Returns: FormSubmission[]
```

---

#### 2. Work Orders Router (`trpc.workOrders.*`)

**List work orders**
```typescript
workOrders.list({
  status?: WorkOrderStatus;
  teamId?: string;
})
// Supervisors: See all work orders
// Operators: See only assigned/claimed work orders
// Returns: WorkOrder[]
```

**Get work order**
```typescript
workOrders.getById({ id: string })
// Returns: WorkOrder with steps and submissions
```

**Create work order** (Supervisor only)
```typescript
workOrders.create({
  title: string;
  description?: string;
  workflowId: string;
  assignedToTeamId?: string;
  priority: Priority;
  dueDate?: Date;
})
// Returns: WorkOrder
```

**Assign to team** (Supervisor only)
```typescript
workOrders.assign({
  workOrderId: string;
  teamId: string;
})
// Returns: WorkOrder
```

**Claim work order** (Operator)
```typescript
workOrders.claim({
  workOrderId: string;
})
// Returns: WorkOrder
// Sets status to IN_PROGRESS
```

**Unclaim work order** (Operator)
```typescript
workOrders.unclaim({
  workOrderId: string;
})
// Returns: WorkOrder
// Resets status to PENDING
```

**Update status**
```typescript
workOrders.updateStatus({
  workOrderId: string;
  status: WorkOrderStatus;
})
// Returns: WorkOrder
```

**Get progress**
```typescript
workOrders.getProgress({
  workOrderId: string;
})
// Returns: {
//   totalSteps: number;
//   completedSteps: number;
//   currentStepIndex: number;
//   percentage: number;
//   currentStep: WorkflowStep;
// }
```

---

#### 3. Teams Router (`trpc.teams.*`)

**List teams**
```typescript
teams.list()
// Returns: Team[] with member counts
```

**Get team**
```typescript
teams.getById({ id: string })
// Returns: Team with members and recent work orders
```

**Create team** (Supervisor only)
```typescript
teams.create({
  name: string;
  description?: string;
})
// Returns: Team
```

**Add member** (Supervisor only)
```typescript
teams.addMember({
  teamId: string;
  userId: string;
})
// Returns: User
// Updates user's teamId
```

**Remove member** (Supervisor only)
```typescript
teams.removeMember({
  userId: string;
})
// Returns: User
// Sets user's teamId to null
```

**Get available members**
```typescript
teams.getAvailableMembers()
// Returns: User[] (all operators)
```

---

#### 4. Entities Router (`trpc.entities.*`)

**List entities**
```typescript
entities.getAll({
  entityType?: string;
  tags?: string[];
})
// Returns: Entity[]
```

**Get entity**
```typescript
entities.getById({ id: string })
// Returns: Entity with children
```

**Create entity**
```typescript
entities.create({
  entityType: string;
  name: string;
  code?: string;
  metadata?: Record<string, any>;
  geometry?: string; // WKT
  tags?: string[];
  parentId?: string;
})
// Returns: Entity
```

**Update entity**
```typescript
entities.update({
  id: string;
  name?: string;
  metadata?: Record<string, any>;
  tags?: string[];
})
// Returns: Entity
```

**Delete entity**
```typescript
entities.delete({ id: string })
// Returns: void
```

---

## Access Control & Permissions

### Role-Based Access Control (RBAC)

#### SUPERVISOR Role
**Capabilities:**
- ✅ Create and manage teams
- ✅ Create and assign work orders
- ✅ View all work orders in organization
- ✅ Create form templates
- ✅ Manage entities
- ✅ Export reports (PDF/CSV)
- ✅ View all submissions
- ✅ Reassign work orders

**Access:**
- Full dashboard access
- `/dashboard/work-orders` - Create, view, assign
- `/dashboard/teams` - Manage teams and members
- `/dashboard/forms` - Create templates
- `/dashboard/entities` - Manage sites/assets

#### OPERATOR Role
**Capabilities:**
- ✅ View work orders assigned to their team
- ✅ Claim available work orders
- ✅ Execute work orders step-by-step
- ✅ Submit forms
- ✅ Release claimed work orders
- ❌ Cannot create work orders
- ❌ Cannot manage teams
- ❌ Cannot see other teams' work

**Access:**
- Simplified operator dashboard
- `/operator` - View assigned and available work
- `/operator/work-order/[id]` - Execute work
- Cannot access supervisor features

### Data Access Rules

**Work Orders:**
- Supervisors: See all in their organization
- Operators: See only work assigned to their team or claimed by them

**Teams:**
- Supervisors: Manage all teams
- Operators: View their own team only

**Form Submissions:**
- Supervisors: See all submissions
- Operators: See only their own submissions

---

## Offline Support & Sync

### Offline Capabilities

The system supports offline work for field operators:

1. **Offline Form Submissions**
   - Forms saved to IndexedDB
   - Queued for sync when online
   - Includes photos and files

2. **Offline Work Order Access**
   - Work order data cached locally
   - Step-by-step execution offline
   - Progress saved locally

3. **Sync Engine**
   - Automatic background sync
   - Conflict resolution (last-write-wins)
   - Retry with exponential backoff
   - Sync queue management

### Sync Queue Structure
```typescript
{
  id: string;
  actionType: "CREATE" | "UPDATE" | "DELETE";
  entityType: "form_submission" | "attachment" | "marker";
  payload: any;
  retryCount: number;
  status: "pending" | "syncing" | "completed" | "failed";
  createdAt: Date;
}
```

---

## Report Generation

### PDF Reports

**Generated for:**
- Completed work orders
- Form submissions

**Contains:**
- Work order details
- All form submissions with data
- User information
- Timestamps
- Attachments references

**Format:**
- Professional layout with jsPDF
- Tables for structured data
- Multi-page support
- Page numbers and timestamps

### CSV Export

**Contains:**
- Work order metadata
- Flattened form submission data
- One row per submission
- Excel-compatible

**Fields:**
- Work Order ID, Title, Status, Priority
- Form Template Name
- Submission ID, Submitted By, Submitted At
- All form fields as columns (Field: fieldname)

---

## Database Schema (PostgreSQL with PostGIS)

### Key Tables

- `organizations` - Multi-tenant organizations
- `users` - User accounts with roles
- `teams` - Team groupings for operators
- `form_templates` - Reusable form definitions
- `workflows` - Workflow definitions with steps
- `work_orders` - Work assignments
- `work_order_steps` - Individual step completions
- `form_submissions` - Submitted form data
- `entities` - Sites, assets, equipment
- `attachments` - File uploads (S3 references)
- `markers` - Location markers for surveys
- `sync_queue` - Offline sync queue

### Relationships

```sql
-- Work Orders
work_orders.workflow_id → workflows.id
work_orders.assigned_to_team_id → teams.id
work_orders.claimed_by_id → users.id
work_orders.created_by_id → users.id

-- Form Submissions
form_submissions.form_template_id → form_templates.id
form_submissions.work_order_id → work_orders.id
form_submissions.work_order_step_id → work_order_steps.id
form_submissions.entity_id → entities.id
form_submissions.submitted_by → users.id

-- Teams
teams.org_id → organizations.id
users.team_id → teams.id

-- Entities
entities.parent_id → entities.id (hierarchical)
```

---

## File Storage (S3/MinIO)

### Attachments

Files uploaded through forms are stored in S3/MinIO:

**Structure:**
```
bucket/
  ├── organizations/{org-id}/
  │   ├── submissions/{submission-id}/
  │   │   ├── photo_field_1.jpg
  │   │   ├── photo_field_2.jpg
  │   │   └── document.pdf
  │   └── attachments/{attachment-id}/
  │       └── file.ext
```

**Metadata in Database:**
```typescript
{
  id: string;
  submissionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string; // S3 key
  thumbnailPath?: string;
  uploadedBy: string;
  uploadedAt: Date;
}
```

---

## Technical Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with PostGIS extension
- **ORM:** Prisma
- **API:** tRPC (type-safe RPC)
- **Authentication:** NextAuth.js
- **File Storage:** S3/MinIO
- **Offline Storage:** IndexedDB (Dexie.js)

### Frontend
- **Framework:** React with Next.js
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **UI:** Tailwind CSS + Shadcn/ui
- **Maps:** Mapbox GL / Leaflet
- **Reports:** jsPDF + Papa Parse

---

## Performance & Scalability

### Database Indexes

Key indexes for performance:
```sql
-- Work orders
CREATE INDEX idx_work_orders_org_status ON work_orders(org_id, status);
CREATE INDEX idx_work_orders_team_status ON work_orders(assigned_to_team_id, status);
CREATE INDEX idx_work_orders_claimed ON work_orders(claimed_by_id);

-- Form submissions
CREATE INDEX idx_submissions_work_order ON form_submissions(work_order_id);
CREATE INDEX idx_submissions_entity ON form_submissions(entity_id);

-- Sync queue
CREATE INDEX idx_sync_queue_user_status ON sync_queue(user_id, status);
```

### Caching Strategy

- **tRPC:** React Query for client-side caching
- **Forms:** Template caching in IndexedDB
- **Entities:** Cached for offline access
- **Work Orders:** Real-time refetch on status changes

---

## Future Enhancements (Not Yet Implemented)

### Planned Features

1. **Workflow Designer UI**
   - Visual workflow builder
   - Drag-and-drop step configuration
   - Live preview

2. **Advanced Step Types**
   - Parallel steps (multiple forms at once)
   - Approval steps (supervisor review)
   - Time-based triggers

3. **Integration APIs**
   - Google Sheets export
   - Webhook notifications
   - REST API for third-party systems

4. **Analytics**
   - Work order completion metrics
   - Team performance dashboards
   - Form submission analytics

5. **Mobile Apps**
   - Native iOS/Android with Capacitor
   - Enhanced offline support
   - Push notifications

---

## Summary

FieldForm provides a comprehensive backend for field work management:

✅ **Forms** - Flexible form templates with 12+ field types
✅ **Workflows** - 4 powerful step primitives for complex processes
✅ **Work Orders** - Complete lifecycle management with team assignment
✅ **RBAC** - Supervisor and Operator roles with proper access control
✅ **Offline Support** - Full offline capabilities with sync engine
✅ **Reports** - PDF and CSV export
✅ **Type Safety** - End-to-end TypeScript with tRPC
✅ **Scalability** - Multi-tenant architecture with PostgreSQL

The system is production-ready for field operations across various industries including facilities management, utilities, environmental services, construction, and more.

