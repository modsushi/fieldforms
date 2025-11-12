# Work Order Step Management - Complete Implementation ✅

## Overview

Implemented a comprehensive step-level management system for work orders with:
- ✅ Step-level user assignments
- ✅ Individual step status tracking (PENDING/IN_PROGRESS/COMPLETED/SKIPPED)
- ✅ Step data persistence with granular tracking
- ✅ Supervisor progress view with detailed step information
- ✅ Permission validation (only assigned users can complete steps)
- ✅ Submission tracking per step
- ✅ Completion timestamps and duration tracking

---

## What Was Implemented

### 1. Database Schema Enhancements

**Updated `WorkOrderStep` Model:**
```prisma
model WorkOrderStep {
  id               String         @id
  workOrderId      String
  stepIndex        Int
  stepDefinitionId String
  stepName         String?        // NEW: Step name for display
  assignedToUserId String?        // NEW: Assign step to specific user
  status           StepStatus     // ENHANCED: Track step status
  data             Json
  startedAt        DateTime?      // NEW: When step was started
  completedAt      DateTime?
  completedById    String?        // NEW: Who completed the step
  createdAt        DateTime
  
  // Relations
  workOrder    WorkOrder
  assignedTo   User?            // NEW: Assigned user
  completedBy  User?            // NEW: User who completed
  submissions  FormSubmission[]
}
```

**User Model Relations:**
```prisma
model User {
  // ... existing fields
  assignedSteps   WorkOrderStep[]  @relation("AssignedSteps")
  completedSteps  WorkOrderStep[]  @relation("CompletedSteps")
}
```

### 2. tRPC API Endpoints

**New Endpoints in `work-orders.ts`:**

#### `getSteps`
Get all steps for a work order with assignments and submissions.

```typescript
trpc.workOrders.getSteps.useQuery({ workOrderId: string })
```

**Returns:**
```typescript
{
  workOrder: WorkOrder & { workflow: Workflow },
  steps: Array<{
    id: string,
    stepIndex: number,
    stepName: string,
    status: StepStatus,
    assignedTo?: { id, name, email },
    completedBy?: { id, name, email },
    completedAt?: Date,
    startedAt?: Date,
    submissions: Array<{
      id: string,
      formTemplate: { id, name },
      submitter: { id, name, email },
      submittedAt: Date
    }>
  }>
}
```

#### `assignStep`
Assign a step to a specific user (Supervisor only).

```typescript
trpc.workOrders.assignStep.useMutation({
  workOrderId: string,
  stepIndex: number,
  userId: string
})
```

#### `unassignStep`
Remove assignment from a step (Supervisor only).

```typescript
trpc.workOrders.unassignStep.useMutation({
  workOrderId: string,
  stepIndex: number
})
```

#### `updateStepStatus`
Update step status with permission validation.

```typescript
trpc.workOrders.updateStepStatus.useMutation({
  workOrderId: string,
  stepIndex: number,
  status: StepStatus // PENDING | IN_PROGRESS | COMPLETED | SKIPPED
})
```

**Permission Logic:**
- If step is assigned to a user, only that user or a supervisor can update it
- Automatically sets `startedAt` when status changes to IN_PROGRESS
- Automatically sets `completedAt` and `completedById` when status changes to COMPLETED

#### `completeStep`
Complete a step with form submission.

```typescript
trpc.workOrders.completeStep.useMutation({
  workOrderId: string,
  stepIndex: number,
  submissionId: string
})
```

**Logic:**
1. Validates permission (assigned user or supervisor)
2. Verifies submission exists and belongs to work order
3. Marks step as COMPLETED
4. Records completion time and user
5. Checks if all steps completed → marks work order COMPLETED
6. Otherwise → advances to next step

#### `getStepDetail`
Get detailed information about a specific step.

```typescript
trpc.workOrders.getStepDetail.useQuery({
  workOrderId: string,
  stepIndex: number
})
```

**Returns:**
```typescript
{
  step: WorkOrderStep with relations,
  stepDefinition: WorkflowStepDefinition,
  workOrder: WorkOrder
}
```

#### `teams.getMembers`
Get all members of a team (for assignment dropdowns).

```typescript
trpc.teams.getMembers.useQuery({ teamId: string })
```

---

### 3. Supervisor Step Management UI

**New Page:** `/dashboard/work-orders/[id]/steps`

**Features:**
- ✅ Visual step list with status indicators
- ✅ Assign/unassign users to specific steps
- ✅ View step completion details (who, when, duration)
- ✅ View all submissions per step
- ✅ Click submissions to view details
- ✅ Color-coded status badges
- ✅ Team member dropdown for assignments

**UI Components:**

```
┌─────────────────────────────────────────────────┐
│ Work Order Steps                                │
│ Daily Inspection - Site A                       │
│                          [📋 Manage Steps]      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ○ Step 1: Safety Check                 [PENDING]│
│   Type: form                                    │
│                                                 │
│   Assignment                                    │
│   [Assign to User ▼]                           │
│                                                 │
│   No submissions yet                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ⏰ Step 2: Equipment Check        [IN_PROGRESS] │
│   Type: form                                    │
│                                                 │
│   Assignment                                    │
│   👤 John Doe (john@example.com)      [×]      │
│                                                 │
│   Completion Details                            │
│   Started: 10 minutes ago                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✓ Step 3: Final Report             [COMPLETED] │
│   Type: form                                    │
│                                                 │
│   Assignment                                    │
│   👤 Jane Smith (jane@example.com)    [×]      │
│                                                 │
│   Completion Details                            │
│   Completed by: Jane Smith                      │
│   Completed at: Nov 11, 2025 14:30             │
│   Duration: 15 minutes                          │
│                                                 │
│   Form Submissions (1)                          │
│   📄 Final Report Form                         │
│      By Jane Smith • Nov 11, 14:30    [View]   │
└─────────────────────────────────────────────────┘
```

**Access:**
- From work order detail page → Click "📋 Manage Steps" button
- Direct URL: `/dashboard/work-orders/{id}/steps`

---

### 4. Enhanced Execution Page

**Updated:** `/operator/work-order/[id]`

**New Features:**
- ✅ Shows step assignment info
- ✅ Warns if step is assigned to someone else
- ✅ Displays current step status badge
- ✅ Uses new `completeStep` endpoint
- ✅ Validates permissions before allowing completion
- ✅ Automatically updates step status to IN_PROGRESS when starting
- ✅ Links submission to specific step

**UI Enhancements:**

```
┌─────────────────────────────────────────────────┐
│ Daily Inspection - Site A                       │
│ Step 2: Equipment Check                         │
│                    [IN_PROGRESS] [PENDING]      │
├─────────────────────────────────────────────────┤
│ Step 2 of 3                      66% complete   │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 👤 Assigned to You                              │
│    John Doe (john@example.com)                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Equipment Check                                 │
│ Complete equipment inspection form              │
└─────────────────────────────────────────────────┘

[Form fields render here...]

[Submit]
```

**If Assigned to Someone Else:**

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Assigned to Another User                     │
│    Jane Smith (jane@example.com)                │
│                                                 │
│ ⚠️ This step is assigned to another user.      │
│    You may not be able to complete it unless    │
│    you're a supervisor.                         │
└─────────────────────────────────────────────────┘
```

---

## Data Flow

### Step Assignment Flow

```
1. Supervisor opens work order detail
   ↓
2. Clicks "📋 Manage Steps"
   ↓
3. Sees list of all workflow steps
   ↓
4. Clicks "Assign to User" on a step
   ↓
5. Selects user from team members dropdown
   ↓
6. Clicks "Assign"
   ↓
7. API: assignStep mutation
   - Creates/updates WorkOrderStep record
   - Sets assignedToUserId
   ↓
8. Step shows assigned user
   - Can be unassigned with [×] button
```

### Step Execution Flow

```
1. User navigates to /operator/work-order/{id}
   ↓
2. System loads:
   - Work order details
   - Current step progress
   - Step detail (including assignment)
   ↓
3. UI checks assignment:
   - If assigned to current user → Allow
   - If assigned to someone else → Warn
   - If not assigned → Allow anyone
   ↓
4. User fills out form
   ↓
5. User clicks Submit
   ↓
6. System:
   a. Updates step status to IN_PROGRESS (if PENDING)
   b. Submits form → creates FormSubmission
   c. Calls completeStep mutation
      - Validates permission
      - Marks step COMPLETED
      - Records completedById and completedAt
      - Links submission to step
   d. Checks completion:
      - If last step → Mark work order COMPLETED
      - Otherwise → Advance to next step
   ↓
7. Success message + navigation
```

### Supervisor Monitoring Flow

```
1. Supervisor opens /dashboard/work-orders/{id}/steps
   ↓
2. System loads:
   - All workflow steps
   - Step records (status, assignments, submissions)
   - Team members (for assignment)
   ↓
3. Supervisor sees:
   - Step-by-step progress
   - Who is assigned to each step
   - Who completed each step (with timestamp)
   - All submissions per step
   - Duration of each step
   ↓
4. Supervisor can:
   - Assign/unassign users
   - View submission details
   - Monitor progress in real-time
```

---

## Permission Matrix

| Action | Unassigned Step | Assigned to Self | Assigned to Other | Supervisor |
|--------|----------------|------------------|-------------------|------------|
| View Step | ✅ | ✅ | ✅ | ✅ |
| Start Step | ✅ | ✅ | ❌ | ✅ |
| Complete Step | ✅ | ✅ | ❌ | ✅ |
| Assign Step | ❌ | ❌ | ❌ | ✅ |
| Unassign Step | ❌ | ❌ | ❌ | ✅ |
| View Submissions | ✅ | ✅ | ✅ | ✅ |

---

## API Usage Examples

### Assign a Step

```typescript
// Supervisor assigns Step 2 to John
const assignMutation = trpc.workOrders.assignStep.useMutation();

await assignMutation.mutateAsync({
  workOrderId: 'work-order-uuid',
  stepIndex: 1, // Step 2 (0-indexed)
  userId: 'john-uuid'
});
```

### Complete a Step

```typescript
// Operator completes current step
const completeStepMutation = trpc.workOrders.completeStep.useMutation();

// 1. Submit form first
const submission = await submitFormMutation.mutateAsync({
  formTemplateId: 'form-uuid',
  data: { field1: 'value1', field2: 'value2' },
  workOrderId: 'work-order-uuid',
  workOrderStepId: 'step-uuid',
  deviceInfo: { ... }
});

// 2. Complete the step
await completeStepMutation.mutateAsync({
  workOrderId: 'work-order-uuid',
  stepIndex: 1,
  submissionId: submission.id
});
```

### View Step Progress

```typescript
// Supervisor views all steps
const { data } = trpc.workOrders.getSteps.useQuery({
  workOrderId: 'work-order-uuid'
});

// data.steps contains:
// [
//   {
//     stepIndex: 0,
//     stepName: "Safety Check",
//     status: "COMPLETED",
//     assignedTo: { name: "John Doe", ... },
//     completedBy: { name: "John Doe", ... },
//     completedAt: "2025-11-11T14:30:00Z",
//     startedAt: "2025-11-11T14:15:00Z",
//     submissions: [{ id: "...", formTemplate: { name: "..." }, ... }]
//   },
//   ...
// ]
```

---

## Testing Guide

### Test 1: Assign a Step

1. **Login as Supervisor** (`admin@test.com`)
2. Go to `/dashboard/work-orders`
3. Click on a work order
4. Click **"📋 Manage Steps"**
5. On any step, click **"Assign to User"**
6. Select a user from dropdown
7. Click **"Assign"**
8. ✅ Verify user appears as assigned
9. ✅ Verify [×] button appears to unassign

### Test 2: Complete Assigned Step

1. **Note the assigned user** from Test 1
2. **Login as that user** (e.g., `operator@test.com`)
3. Go to `/operator`
4. Claim the work order (if not claimed)
5. Click **"Work On This →"**
6. ✅ Verify "Assigned to You" badge appears
7. Fill out the form
8. Click **Submit**
9. ✅ Verify step completes successfully
10. ✅ Verify auto-advance to next step

### Test 3: Try to Complete Someone Else's Step

1. **Login as different operator**
2. Navigate to work order execution
3. ✅ Verify warning: "Assigned to Another User"
4. Try to submit form
5. ✅ Verify error: "This step is assigned to another user"

### Test 4: Supervisor Override

1. **Login as Supervisor**
2. Navigate to work order execution
3. Try to complete step assigned to operator
4. ✅ Verify submission works (supervisors can override)

### Test 5: View Step Progress

1. **Login as Supervisor**
2. Go to work order detail
3. Click **"📋 Manage Steps"**
4. ✅ Verify all steps listed
5. ✅ Verify status badges correct
6. ✅ Verify assignments shown
7. ✅ Verify completion details shown
8. ✅ Verify submissions listed
9. Click on a submission
10. ✅ Verify redirects to submission detail page

### Test 6: Step Duration Tracking

1. Start a step (note the time)
2. Complete the step after a few minutes
3. Go to step management page
4. ✅ Verify "Duration: X minutes" appears
5. ✅ Verify started/completed timestamps correct

---

## Database Queries

### Get All Steps with Details

```sql
SELECT 
  wos.*,
  u1.name as assigned_to_name,
  u2.name as completed_by_name,
  COUNT(fs.id) as submission_count
FROM work_order_steps wos
LEFT JOIN users u1 ON wos.assigned_to_user_id = u1.id
LEFT JOIN users u2 ON wos.completed_by_id = u2.id
LEFT JOIN form_submissions fs ON fs.work_order_step_id = wos.id
WHERE wos.work_order_id = 'work-order-uuid'
GROUP BY wos.id, u1.name, u2.name
ORDER BY wos.step_index;
```

### Get User's Assigned Steps

```sql
SELECT 
  wos.*,
  wo.title as work_order_title,
  wo.status as work_order_status
FROM work_order_steps wos
JOIN work_orders wo ON wos.work_order_id = wo.id
WHERE wos.assigned_to_user_id = 'user-uuid'
  AND wos.status IN ('PENDING', 'IN_PROGRESS')
ORDER BY wo.created_at DESC;
```

### Get Step Completion Stats

```sql
SELECT 
  wo.id,
  wo.title,
  COUNT(*) as total_steps,
  COUNT(CASE WHEN wos.status = 'COMPLETED' THEN 1 END) as completed_steps,
  AVG(EXTRACT(EPOCH FROM (wos.completed_at - wos.started_at))/60) as avg_duration_minutes
FROM work_orders wo
LEFT JOIN work_order_steps wos ON wo.id = wos.work_order_id
WHERE wo.org_id = 'org-uuid'
GROUP BY wo.id, wo.title;
```

---

## Benefits

### For Supervisors
- ✅ **Accountability:** Know exactly who is responsible for each step
- ✅ **Visibility:** See real-time progress on all steps
- ✅ **Control:** Assign critical steps to specific team members
- ✅ **Tracking:** Monitor completion times and identify bottlenecks
- ✅ **Audit Trail:** Complete history of who did what and when

### For Operators
- ✅ **Clarity:** Know exactly which steps are assigned to them
- ✅ **Focus:** See only relevant work
- ✅ **Protection:** Can't accidentally complete someone else's work
- ✅ **Feedback:** Clear status indicators for progress

### For System
- ✅ **Data Integrity:** Step-level granularity prevents data loss
- ✅ **Flexibility:** Steps can be reassigned if needed
- ✅ **Scalability:** Supports complex multi-user workflows
- ✅ **Reporting:** Rich data for analytics and optimization

---

## Future Enhancements

### Planned Features
- [ ] Step dependencies (Step 2 can't start until Step 1 complete)
- [ ] Step deadlines (individual due dates per step)
- [ ] Step comments/notes
- [ ] Step approval workflow (supervisor must approve before next step)
- [ ] Bulk step assignment
- [ ] Step templates (pre-assign roles to step types)
- [ ] Step notifications (email/push when assigned)
- [ ] Step time estimates vs actuals
- [ ] Step skill requirements
- [ ] Step checklists within forms

### Advanced Features
- [ ] Parallel steps (multiple steps can be done simultaneously)
- [ ] Optional steps (can be skipped)
- [ ] Conditional step visibility based on previous answers
- [ ] Step reassignment history
- [ ] Step performance analytics
- [ ] Step workload balancing
- [ ] Step escalation rules

---

## Summary

### What Works Now ✅

1. **Step Assignment**
   - Supervisors can assign any step to any team member
   - Assignments are optional (unassigned steps can be done by anyone)
   - Easy reassignment with unassign/reassign

2. **Step Execution**
   - Operators see assignment status
   - Permission validation prevents unauthorized completion
   - Supervisors can override and complete any step

3. **Step Tracking**
   - Individual status per step (PENDING/IN_PROGRESS/COMPLETED/SKIPPED)
   - Start and completion timestamps
   - Duration calculation
   - Completion user tracking

4. **Step Monitoring**
   - Comprehensive step management UI for supervisors
   - Real-time progress visibility
   - Submission tracking per step
   - Easy navigation to submission details

5. **Data Persistence**
   - All step data saved in database
   - Submissions linked to specific steps
   - Complete audit trail
   - Queryable for reporting

### Key Files Modified/Created

**Database:**
- ✅ `packages/database/prisma/schema.prisma` - Added step assignment fields

**Backend API:**
- ✅ `apps/web/src/server/api/routers/work-orders.ts` - Added 6 new endpoints
- ✅ `apps/web/src/server/api/routers/teams.ts` - Added `getMembers` endpoint

**Frontend Pages:**
- ✅ `apps/web/src/app/dashboard/work-orders/[id]/steps/page.tsx` - NEW step management UI
- ✅ `apps/web/src/app/dashboard/work-orders/[id]/page.tsx` - Added "Manage Steps" button
- ✅ `apps/web/src/app/operator/work-order/[id]/page.tsx` - Enhanced with assignment info

---

## Quick Start

### Create Work Order with Steps

```bash
# 1. Login as supervisor
Email: admin@test.com
Password: password

# 2. Create work order
Go to: /dashboard/work-orders/new
Fill in details and select workflow
Submit

# 3. Manage steps
Click: "📋 Manage Steps"
Assign steps to team members
```

### Execute Assigned Work

```bash
# 1. Login as operator
Email: operator@test.com
Password: password

# 2. View work
Go to: /operator
See assigned work orders

# 3. Execute
Click: "Work On This →"
Fill forms step by step
Submit each step
```

### Monitor Progress

```bash
# 1. Login as supervisor
Email: admin@test.com
Password: password

# 2. View progress
Go to: /dashboard/work-orders/{id}/steps
See all steps, assignments, and submissions
Monitor completion in real-time
```

---

## 🎉 Success!

You now have a complete step-level management system with:
- ✅ User assignments per step
- ✅ Permission validation
- ✅ Status tracking
- ✅ Supervisor oversight
- ✅ Detailed progress monitoring
- ✅ Complete audit trail

**Ready to use!** Test it out and see the power of granular workflow management.


