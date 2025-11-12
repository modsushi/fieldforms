# FieldForm Codebase Architecture Overview

## Executive Summary

FieldForm is a comprehensive field operations platform with:
- **Dynamic form system** with conditional logic support
- **Workflow execution engine** with branching and iteration
- **Work order management** system for task assignment and tracking
- **Entity system** for managing field objects (sites, assets, equipment, etc.)
- **Offline-first architecture** with sync capabilities

---

## 1. CURRENT FORM SYSTEM IMPLEMENTATION

### 1.1 Form Structure (Type System)

**File:** `/packages/types/src/form.ts`

#### FormTemplate (Root Schema)
```typescript
{
  id: string;
  orgId: string;
  name: string;
  description?: string;
  category?: string;
  version: number;
  sections: FormSection[];
  
  // Advanced features
  dynamicFields?: {
    source: 'entity' | 'workflow_context' | 'api';
    mapping: Record<string, string>;
  };
  
  computedFields?: Array<{
    fieldId: string;
    expression: string;
    dependencies: string[];
  }>;
  
  variables?: Array<{
    name: string;
    source: 'context' | 'entity' | 'user' | 'environment';
    path: string;
  }>;
}
```

#### FormSection
```typescript
{
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  
  // Conditional visibility
  visible?: ConditionalRule;
  
  // Repeatable sections
  repeatable?: {
    min?: number;
    max?: number;
    addButtonText?: string;
  };
}
```

#### FormField
```typescript
{
  id: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'datetime' | 
        'checkbox' | 'radio' | 'textarea' | 'signature' | 'photo' | 'file' | 
        'location' | 'entity_selector' | 'entity_creator' | 'form_selector' | 
        'barcode' | 'qrcode';
  label: string;
  placeholder?: string;
  helpText?: string;
  
  // Conditional properties
  required?: boolean | ConditionalRule;
  visible?: ConditionalRule;
  disabled?: ConditionalRule;
  
  // Validation
  validation?: ValidationRule[];
  
  // Options and defaults
  options?: {
    source: 'static' | 'entity' | 'api' | 'previous_submission';
    value: any;
  };
  
  defaultValue?: {
    source: 'static' | 'context' | 'entity_property' | 'calculation';
    value: any;
  };
}
```

### 1.2 Form Processing Pipeline

**Location:** `/apps/web/src/components/form-renderer/form-renderer.tsx`

1. **Initialization** → Load FormTemplate from API
2. **Watch Values** → React Hook Form watches all field changes in real-time
3. **Evaluate Conditions** → For each field/section, evaluate conditional rules
4. **Render Dynamically** → Show/hide fields and sections based on conditions
5. **Validate** → Client-side validation with error messages
6. **Submit** → Send form submission to backend as FormSubmission record

**Form Submission Structure:**
```typescript
{
  id: string;
  formTemplateId: string;
  entityId?: string;
  workflowStepId?: string;
  workOrderStepId?: string;
  data: Record<string, any>;              // Form field values
  computedData?: Record<string, any>;     // Calculated fields
  validationStatus: Record<string, any>;  // Field validation results
  attachments: Attachment[];              // Photos, files, signatures
  location?: GeoPoint;                    // GPS coordinates
  deviceInfo?: Record<string, any>;       // Device metadata
  submittedBy: string;                    // User ID
  submittedAt: Date;
  syncedAt?: Date;                        // For offline sync tracking
}
```

### 1.3 Supported Field Types (15 Types)

1. **Text Input** - Simple text with validation
2. **Number** - Numeric input with min/max
3. **Select** - Single choice from list
4. **Multiselect** - Multiple choices
5. **Date** - Date picker
6. **Datetime** - Date + time picker
7. **Checkbox** - Boolean toggle
8. **Radio** - Mutually exclusive options
9. **Textarea** - Long text input
10. **Signature** - Digital signature capture
11. **Photo** - Camera/photo upload
12. **File** - File attachment
13. **Location** - GPS coordinate capture
14. **Entity Selector** - Link to existing entity
15. **Entity Creator** - Create new entity inline

---

## 2. EXISTING CONDITIONAL LOGIC & BRANCHING

### 2.1 Conditional Rule System

**File:** `/packages/types/src/form.ts`

#### ConditionalRule Schema
```typescript
{
  type: 'expression' | 'rule';
  value: string | {
    conditions: {
      all?: Condition[];   // AND logic
      any?: Condition[];   // OR logic
      not?: Condition;     // NOT logic
    };
  };
}
```

#### Single Condition
```typescript
{
  field: string;           // ID of field to check
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 
            'greater_than' | 'less_than' | 'in' | 'not_in' | 'regex';
  value: any;             // Value to compare against
}
```

### 2.2 Conditional Evaluator Engine

**File:** `/apps/web/src/lib/forms/conditional-evaluator.ts` (230+ lines)

**Core Functions:**

1. **evaluateCondition()** - Evaluate a single condition
   - Supports 9 operators
   - Handles strings, numbers, arrays
   - Regex support

2. **evaluateConditionalRule()** - Evaluate full rule
   - AND/OR/NOT logic
   - Recursive evaluation
   - Boolean fallback support

3. **isFieldVisible()** - Check if field should display
4. **isFieldDisabled()** - Check if field should be disabled
5. **isFieldRequired()** - Check if field is required
6. **isSectionVisible()** - Check if section should display
7. **getVisibleFields()** - Get all currently visible fields

### 2.3 Supported Operators

| Operator | Type | Example |
|----------|------|---------|
| `equals` | Exact match | `status equals "approved"` |
| `not_equals` | Inverse match | `type not_equals "manual"` |
| `contains` | Substring/array | `tags contains "urgent"` |
| `not_contains` | Negative contain | `description not_contains "hold"` |
| `greater_than` | Numeric > | `count greater_than 5` |
| `less_than` | Numeric < | `amount less_than 100` |
| `in` | Array membership | `status in ["pending", "active"]` |
| `not_in` | Array exclude | `priority not_in ["low"]` |
| `regex` | Pattern match | `email regex "^[^@]+@example\\.com$"` |

### 2.4 Real-time Evaluation Flow

```
User types in field
    ↓
React Hook Form fires change event
    ↓
form-renderer.tsx watches all values
    ↓
For each field/section, call conditional-evaluator
    ↓
Evaluator checks conditions against form data
    ↓
Component re-renders with show/hide
```

### 2.5 Example: Conditional Field

**JSON Definition:**
```json
{
  "id": "equipment_other",
  "type": "text",
  "label": "Please specify equipment type",
  "visible": {
    "type": "rule",
    "value": {
      "conditions": {
        "all": [
          {
            "field": "equipment_type",
            "operator": "equals",
            "value": "other"
          }
        ]
      }
    }
  }
}
```

**Behavior:**
- Field hidden by default
- Shows only when `equipment_type` field equals "other"
- Updates instantly as user selects values

---

## 3. WORKFLOW SYSTEM IMPLEMENTATION

### 3.1 Workflow Primitives

**File:** `/packages/types/src/workflow-primitives.ts`

Workflows are built from composable primitives:

#### 1. FormStep
```typescript
{
  type: 'form';
  config: {
    formTemplateId: string;
    entityId?: string;           // Link to specific entity
    allowMultiple?: boolean;
    minimumSubmissions?: number;
  };
}
```

#### 2. ConditionalStep (NOT YET IMPLEMENTED IN UI)
```typescript
{
  type: 'conditional';
  config: {
    sourceStepId: string;        // Reference to previous step
    fieldId: string;             // Which field to evaluate
    branches: Array<{
      condition: {
        operator: 'equals' | 'contains' | 'greater_than' | 'in' | 'not_in';
        value: any;
      };
      nextSteps: WorkflowStep[]; // Nested steps
    }>;
    defaultBranch?: WorkflowStep[];
  };
}
```

#### 3. IteratorStep (NOT YET IMPLEMENTED IN UI)
```typescript
{
  type: 'iterator';
  config: {
    sourceType: 'entities' | 'manual_list' | 'field_value' | 'query';
    entityType?: string;
    items?: Array<{id: string; label: string}>;
    steps: WorkflowStep[];       // Repeat these steps per item
    allowSkip?: boolean;
    requireAll?: boolean;
  };
}
```

#### 4. LocationMarkerStep (NOT YET IMPLEMENTED IN UI)
```typescript
{
  type: 'location-marker';
  config: {
    minMarkers?: number;
    maxMarkers?: number;
    formTemplateId: string;
    mapCenter?: {lat: number; lng: number};
    mapZoom?: number;
    allowPhotos?: boolean;
    requireDescription?: boolean;
  };
}
```

### 3.2 Workflow Definition & Execution

**Database Model:** `/packages/database/prisma/schema.prisma`

#### Workflow (Template)
```typescript
{
  id: string;
  orgId: string;
  name: string;
  description?: string;
  definition: {                  // Full workflow structure
    version: string;
    steps: WorkflowStep[];      // Array of primitives
    metadata?: {
      estimatedDuration?: number;
      requiredCapabilities?: string[];
      tags?: string[];
    };
  };
  triggerConfig: Record<string, any>;
  contextSchema?: Record<string, any>;
  completionRules?: any[];
  scheduling?: Record<string, any>;
  isActive: boolean;
}
```

#### WorkflowInstance (Runtime)
```typescript
{
  id: string;
  workflowId: string;
  parentInstanceId?: string;
  triggerData: Record<string, any>;
  context: Record<string, any>;   // Data passed between steps
  currentStep: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  startedBy: string;              // User ID
}
```

#### WorkflowStepInstance (Step Execution)
```typescript
{
  id: string;
  workflowInstanceId: string;
  stepIndex: number;
  stepType: string;
  stepConfig: Record<string, any>;
  assignedTo?: string[];          // User IDs
  assignedEntities?: string[];    // Entity IDs
  status: 'pending' | 'active' | 'completed' | 'failed';
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
}
```

### 3.3 Workflow Engine

**File:** `/apps/web/src/lib/workflow/engine.ts` (395 lines)

**Core Methods:**

| Method | Purpose |
|--------|---------|
| `initializeExecution()` | Create new workflow instance |
| `getCurrentStep()` | Get current step to execute |
| `executeStep()` | Mark step as complete with data |
| `completeStep()` | Complete step and advance to next |
| `getNextStep()` | Determine which step comes next |
| `evaluateConditionalBranch()` | Evaluate conditional branches |
| `expandIteratorSteps()` | Expand iterator to individual items |
| `getWorkOrderProgress()` | Calculate completion percentage |
| `isWorkflowComplete()` | Check if all steps done |
| `skipStep()` | Skip step (if allowed) |

**Step Progression Logic:**
```
Start Workflow
    ↓
Load first step from definition
    ↓
Render step component
    ↓
User completes step (submits form)
    ↓
Engine evaluates next step logic:
    - If FormStep → increment index
    - If ConditionalStep → evaluate branches
    - If IteratorStep → expand items
    - If LocationMarkerStep → show map
    ↓
Update WorkflowInstance.currentStep
    ↓
Load next step and repeat
    ↓
No more steps → Mark workflow as COMPLETED
```

### 3.4 Work Orders (Task Management)

**Database Model:** `/packages/database/prisma/schema.prisma`

```typescript
{
  id: string;
  orgId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  workflowId: string;              // Which workflow to execute
  currentStepIndex: number;        // Progress tracking
  
  assignedToTeamId?: string;       // Team assignment
  claimedById?: string;            // Who claimed it
  
  dueDate?: Date;
  completedAt?: Date;
  
  createdById: string;
  createdAt: Date;
  
  // Relations
  steps: WorkOrderStep[];          // History of step execution
  submissions: FormSubmission[];   // All form submissions
}
```

**WorkOrderStep (Step Execution Record):**
```typescript
{
  id: string;
  workOrderId: string;
  stepIndex: number;
  stepDefinitionId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  data: Record<string, any>;       // Form data submitted
  completedAt?: Date;
  completedById?: string;
}
```

---

## 4. KEY COMPONENTS & ARCHITECTURE

### 4.1 Frontend Component Structure

```
apps/web/src/
├── components/
│   ├── form-builder/                 # Form creation UI
│   │   ├── form-builder.tsx
│   │   ├── field-palette.tsx
│   │   ├── field-item.tsx
│   │   ├── field-properties-panel.tsx
│   │   ├── conditional-rule-builder.tsx  ⭐ Conditional UI
│   │   ├── simple-conditional-builder.tsx
│   │   └── section-editor-dialog.tsx
│   │
│   ├── form-renderer/                # Form display & submission
│   │   ├── form-renderer.tsx         ⭐ Renders with conditions
│   │   ├── field-renderer.tsx
│   │   └── index.ts
│   │
│   ├── form-fields/                  # 15 field type components
│   │   ├── text-field.tsx
│   │   ├── number-field.tsx
│   │   ├── select-field.tsx
│   │   ├── checkbox-field.tsx
│   │   ├── radio-field.tsx
│   │   ├── date-field.tsx
│   │   ├── datetime-field.tsx
│   │   ├── file-field.tsx
│   │   ├── photo-field.tsx
│   │   ├── location-field.tsx
│   │   ├── entity-selector-field.tsx
│   │   ├── entity-creator-field.tsx
│   │   ├── entity-selector-controlled.tsx
│   │   ├── entity-creator-controlled.tsx
│   │   └── textarea-field.tsx
│   │
│   ├── workflow/                     # Workflow execution UI
│   │   └── steps/
│   │       ├── form-step.tsx         ⭐ Executes form steps
│   │       └── ...other step types
│   │
│   └── map/                          # Location-based workflows
│       ├── EntityMapView.tsx
│       ├── EntityMarkers.tsx
│       ├── EntitySelector.tsx
│       └── MapboxMap.tsx
│
├── lib/
│   ├── forms/
│   │   └── conditional-evaluator.ts  ⭐ Conditional logic engine
│   ├── workflow/
│   │   └── engine.ts                 ⭐ Workflow execution engine
│   ├── auth/
│   │   └── rbac.ts                   # Role-based access control
│   ├── geo/
│   │   ├── geometry-utils.ts
│   │   └── spatial-queries.ts
│   ├── offline/
│   │   ├── manager.ts
│   │   ├── sync-engine.ts
│   │   └── db.ts
│   └── storage/
│       └── s3-client.ts
│
├── store/                            # Zustand state management
│   ├── form-builder.ts               # Form editor state
│   ├── form-renderer.ts              # Form fill state
│   └── offline-sync.ts               # Offline sync state
│
└── server/
    └── api/
        ├── routers/
        │   ├── forms.ts              # Form CRUD API
        │   ├── workflows.ts          # Workflow CRUD API
        │   ├── work-orders.ts        # Work order API
        │   ├── entities.ts           # Entity API
        │   ├── teams.ts              # Team API
        │   └── auth.ts               # Authentication API
        └── trpc.ts                   # tRPC configuration
```

### 4.2 State Management

**Zustand Stores:**

1. **useFormBuilder** (`form-builder.ts`)
   - Current form being edited
   - Selected field/section
   - Section/field management actions
   - Reordering logic

2. **useFormRenderer** (`form-renderer.ts`)
   - Form data being filled
   - Field errors
   - Visible fields (set by conditional evaluator)
   - Field value/error actions

3. **useOnlineSyncManager** (`offline-sync.ts`)
   - Pending sync queue
   - Sync status
   - Retry logic

### 4.3 API Layer (tRPC Routers)

**File:** `/apps/web/src/server/api/routers/`

#### formsRouter
- `getTemplates()` - List with filtering
- `getTemplate(id)` - Single template
- `createTemplate(data)` - Create new
- `updateTemplate(id, data)` - Edit
- `deleteTemplate(id)` - Archive
- `getSubmissions(templateId)` - Get submissions

#### workflowsRouter
- `list()` - All workflows
- `getById(id)` - Single workflow
- `create(data)` - Create workflow
- `update(id, data)` - Edit workflow
- `delete(id)` - Archive

#### work-ordersRouter
- `list()` - All work orders
- `getById(id)` - Single work order
- `create(workflowId)` - Create and assign
- `updateStatus(id, status)` - Update status
- `claimWorkOrder(id)` - Operator claims
- `getProgress(id)` - Step progress

#### entitiesRouter
- `list()` - Query entities
- `getById(id)` - Single entity
- `create(data)` - Create entity
- `update(id, data)` - Edit entity
- `delete(id)` - Archive

---

## 5. DATABASE SCHEMA

**Location:** `/packages/database/prisma/schema.prisma`

### Core Tables

```
organizations (n) ←→ (1) users
organizations (n) ←→ (n) entities
organizations (n) ←→ (n) form_templates
organizations (n) ←→ (n) workflows
organizations (n) ←→ (n) work_orders
organizations (n) ←→ (n) teams

form_templates (1) ←→ (n) form_submissions
workflows (1) ←→ (n) work_orders
workflows (1) ←→ (n) workflow_instances

work_orders (1) ←→ (n) work_order_steps
work_orders (1) ←→ (n) form_submissions

workflow_instances (1) ←→ (n) workflow_step_instances

form_submissions (1) ←→ (n) attachments

entities (1) ←→ (n) entity_relationships
entities (1) ←→ (n) form_submissions
```

### Key Fields

**FormTemplate.schema** (JSONB)
- Stores entire form definition including sections, fields, and conditional rules

**Workflow.definition** (JSONB)
- Stores workflow structure: steps array with primitives

**FormSubmission.data** (JSONB)
- User-submitted field values

**FormSubmission.computedData** (JSONB)
- Calculated field results

---

## 6. CONDITIONAL LOGIC FEATURES (IMPLEMENTED ✅)

### What's Working

✅ **Field Visibility** - Show/hide fields based on conditions
✅ **Field Disabled State** - Disable fields conditionally
✅ **Conditional Required** - Make fields required based on conditions
✅ **Section Visibility** - Show/hide entire sections
✅ **AND/OR/NOT Logic** - Combine conditions with boolean logic
✅ **9 Operators** - equals, not_equals, contains, greater_than, less_than, in, not_in, regex
✅ **Real-time Evaluation** - Instant updates as user types
✅ **Nested Conditions** - Conditions within conditional sections

### UI Components for Conditions

1. **ConditionalRuleBuilder** - Visual rule editor
2. **Field Properties Panel** - Condition configuration
3. **FormRenderer** - Evaluation on render

---

## 7. WORKFLOW BRANCHING CAPABILITIES

### Current State

**In Type Definitions (Ready for Implementation):**
- ✅ ConditionalStep type defined
- ✅ IteratorStep type defined
- ✅ LocationMarkerStep type defined
- ✅ WorkflowEngine evaluation methods written

**Not Yet in UI:**
- ❌ Visual workflow builder for conditional branches
- ❌ Iterator step configuration UI
- ❌ Location marker step configuration UI
- ❌ Step type selector in workflow builder

**Engine Ready:**
- ✅ `evaluateConditionalBranch()` method implemented
- ✅ `expandIteratorSteps()` method implemented
- ✅ Condition evaluation logic completed

---

## 8. VALIDATION & ERROR HANDLING

### Field Validation

**Rules Supported:**
```typescript
{
  type: 'min' | 'max' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value: any;
  message?: string;
}
```

**Validation Location:** React Hook Form integration + custom validators

### Error Display
- Field-level error messages
- Real-time validation feedback
- Color coding (red borders, error text)

---

## 9. DATA FLOW DIAGRAMS

### Form Submission Flow
```
1. User opens work order
   ↓
2. FormStepComponent loads form template
   ↓
3. FormRenderer mounts with template
   ↓
4. React Hook Form initializes with defaultValues
   ↓
5. User fills fields (fields re-evaluate conditions with watch())
   ↓
6. User submits
   ↓
7. React Hook Form validates
   ↓
8. POST form_submissions with:
   - formTemplateId
   - workOrderStepId
   - data: {field_id: value, ...}
   - submittedBy: userId
   ↓
9. Backend stores in FormSubmission table
   ↓
10. Frontend calls workflowEngine.completeStep()
    ↓
11. Engine calculates nextStep
    ↓
12. UI loads next step component
    ↓
13. Repeat 3-12 until no more steps
    ↓
14. Work order marked COMPLETED
```

### Workflow Execution Flow
```
WorkOrder Created
    ↓
currentStepIndex = 0
    ↓
Load definition.steps[0]
    ↓
Render appropriate component:
   - FormStep → FormStepComponent
   - ConditionalStep → [Not yet in UI]
   - IteratorStep → [Not yet in UI]
   - LocationMarkerStep → [Not yet in UI]
    ↓
User completes step
    ↓
Calculate next step:
    - FormStep: currentStepIndex++
    - ConditionalStep: evaluateConditionalBranch()
    - IteratorStep: expandIteratorSteps()
    ↓
Update WorkflowInstance
    ↓
Fetch new current step definition
    ↓
Render new step component
    ↓
Repeat until no more steps
```

---

## 10. KEY FILES REFERENCE

### Type Definitions
- `/packages/types/src/form.ts` - Form types
- `/packages/types/src/workflow.ts` - Workflow types
- `/packages/types/src/workflow-primitives.ts` - Workflow primitives
- `/packages/types/src/entity.ts` - Entity types

### Form System
- `/apps/web/src/lib/forms/conditional-evaluator.ts` ⭐ - Conditional logic engine
- `/apps/web/src/components/form-renderer/form-renderer.tsx` ⭐ - Form rendering with conditions
- `/apps/web/src/components/form-builder/conditional-rule-builder.tsx` ⭐ - Condition UI builder

### Workflow System
- `/apps/web/src/lib/workflow/engine.ts` ⭐ - Workflow execution engine
- `/apps/web/src/components/workflow/steps/form-step.tsx` - Form step rendering

### API
- `/apps/web/src/server/api/routers/forms.ts` - Forms API
- `/apps/web/src/server/api/routers/workflows.ts` - Workflows API
- `/apps/web/src/server/api/routers/work-orders.ts` - Work orders API

### State Management
- `/apps/web/src/store/form-builder.ts` - Form editor state
- `/apps/web/src/store/form-renderer.ts` - Form fill state

### Database
- `/packages/database/prisma/schema.prisma` - Complete schema

---

## SUMMARY OF CAPABILITIES

### Forms ✅
- Create forms with 15+ field types
- Organize fields into sections
- Conditional visibility/disabled/required rules
- Real-time evaluation
- Nested conditionals

### Workflows ✅
- Define multi-step processes
- Simple step progression
- Progress tracking

### Workflows (Types Ready, UI Pending) 🔄
- Conditional branching
- Iteration over items
- Location-based steps

### Work Orders ✅
- Assign workflows as work orders
- Track progress
- Team assignment
- Operator claiming
- Step history

### Entities ✅
- Create polymorphic entities (sites, assets, equipment)
- Link to form submissions
- Hierarchical relationships
- Tags and metadata

---

## NEXT STEPS FOR CONDITIONAL BRANCHING PLAN

To implement conditional branching in workflows:

1. **Create Conditional Step UI Component**
   - Visual rule builder (similar to form conditional builder)
   - Source step selector
   - Field selector
   - Operator/value configuration
   - Branch path editor

2. **Extend Workflow Editor**
   - Step type selector to include "Conditional"
   - Conditional step properties panel
   - Branch path visualization

3. **Integrate with Workflow Engine**
   - Engine already has evaluation logic
   - Just need to call evaluateConditionalBranch()
   - Queue next steps based on condition

4. **Test & Validate**
   - Create test workflows with conditional branches
   - Validate step progression
   - Test all operators

This architecture provides a solid foundation for implementing conditional branching with minimal changes needed.
