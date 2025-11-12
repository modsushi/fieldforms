# Step Management - Quick Start Guide

## 🎯 What You Can Do Now

### As a Supervisor
1. **Assign steps to specific users**
2. **Monitor step-by-step progress**
3. **View all submissions per step**
4. **Track who completed what and when**
5. **See step durations and bottlenecks**

### As an Operator
1. **See which steps are assigned to you**
2. **Complete assigned steps**
3. **Get warnings if trying to complete someone else's step**

---

## ⚡ 3-Minute Test

### Step 1: Create a Work Order (30 seconds)

```bash
# Login as Supervisor
Email: admin@test.com
Password: password

# Navigate
Go to: /dashboard/work-orders/new

# Fill in:
Title: "Test Step Management"
Workflow: Select any workflow
Priority: Medium
Team: Select a team (optional)

# Submit
Click: "Create Work Order"
```

### Step 2: Assign Steps to Users (1 minute)

```bash
# On work order detail page
Click: "📋 Manage Steps" button (top right)

# You'll see all workflow steps listed

# For Step 1:
Click: "Assign to User"
Select: operator@test.com (or any user)
Click: "Assign"

# For Step 2:
Click: "Assign to User"
Select: admin@test.com (yourself)
Click: "Assign"

# Leave Step 3 unassigned (anyone can do it)
```

### Step 3: Execute as Operator (1.5 minutes)

```bash
# Logout and login as Operator
Email: operator@test.com
Password: password

# Navigate
Go to: /operator
OR
Go to: /dashboard/work-orders
Click on your work order
Click: "🚀 Start Work"

# You'll see:
✅ "Assigned to You" badge (for Step 1)

# Fill out the form
Enter some test data
Click: "Submit"

# Step 1 completes!
✅ Auto-advances to Step 2

# But Step 2 shows:
⚠️ "Assigned to Another User" (admin@test.com)

# Try to submit anyway
❌ Error: "This step is assigned to another user"
```

### Step 4: View Progress as Supervisor (30 seconds)

```bash
# Login as Supervisor again
Email: admin@test.com
Password: password

# Navigate
Go to: /dashboard/work-orders/{id}/steps

# You'll see:
✅ Step 1: COMPLETED
   - Assigned to: operator@test.com
   - Completed by: operator@test.com
   - Completed at: [timestamp]
   - Duration: X minutes
   - Submissions: 1 [View]

⏰ Step 2: PENDING
   - Assigned to: admin@test.com
   - No submissions yet

○ Step 3: PENDING
   - Not assigned
   - No submissions yet
```

---

## 📋 Key Features

### 1. Step Assignment

**Where:** `/dashboard/work-orders/{id}/steps`

**How:**
1. Click "Assign to User" on any step
2. Select user from dropdown
3. Click "Assign"

**To Unassign:**
- Click the [×] button next to assigned user

**Notes:**
- Only supervisors can assign/unassign
- Assignments are optional
- Unassigned steps can be completed by anyone
- Assigned steps can only be completed by assigned user or supervisor

### 2. Step Execution with Validation

**Where:** `/operator/work-order/{id}` or `/dashboard/work-orders/{id}` → "Start Work"

**Features:**
- Shows "Assigned to You" badge if step is yours
- Shows warning if step is assigned to someone else
- Validates permission on submission
- Auto-updates step status (PENDING → IN_PROGRESS → COMPLETED)
- Records completion time and user
- Links submission to specific step

### 3. Progress Monitoring

**Where:** `/dashboard/work-orders/{id}/steps`

**What You See:**
- All steps with status badges
- Assignments for each step
- Completion details (who, when, duration)
- All submissions per step
- Click submissions to view details

**Status Indicators:**
- ○ PENDING (gray)
- ⏰ IN_PROGRESS (blue)
- ✓ COMPLETED (green)
- ⚠️ SKIPPED (yellow)

---

## 🔑 API Reference

### Get All Steps

```typescript
const { data } = trpc.workOrders.getSteps.useQuery({
  workOrderId: 'work-order-uuid'
});

// data.steps = [
//   {
//     stepIndex: 0,
//     stepName: "Safety Check",
//     status: "COMPLETED",
//     assignedTo: { id, name, email },
//     completedBy: { id, name, email },
//     completedAt: Date,
//     startedAt: Date,
//     submissions: [...]
//   },
//   ...
// ]
```

### Assign a Step

```typescript
const assignMutation = trpc.workOrders.assignStep.useMutation();

await assignMutation.mutateAsync({
  workOrderId: 'work-order-uuid',
  stepIndex: 0,
  userId: 'user-uuid'
});
```

### Complete a Step

```typescript
const completeStepMutation = trpc.workOrders.completeStep.useMutation();

// 1. Submit form first
const submission = await submitFormMutation.mutateAsync({
  formTemplateId: 'form-uuid',
  data: formData,
  workOrderId: 'work-order-uuid',
  workOrderStepId: 'step-uuid',
  deviceInfo: { ... }
});

// 2. Complete the step
await completeStepMutation.mutateAsync({
  workOrderId: 'work-order-uuid',
  stepIndex: 0,
  submissionId: submission.id
});
```

---

## 🎨 UI Screenshots (Conceptual)

### Step Management Page

```
┌──────────────────────────────────────────────────┐
│ Work Order Steps                                 │
│ Daily Inspection - Site A          [← Back]      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ✓ Step 1: Safety Check            [COMPLETED]   │
│   Type: form                                     │
│                                                  │
│   Assignment                                     │
│   👤 John Doe (john@example.com)      [×]       │
│                                                  │
│   Completion Details                             │
│   Completed by: John Doe                         │
│   Completed at: Nov 11, 2025 14:30              │
│   Duration: 15 minutes                           │
│                                                  │
│   Form Submissions (1)                           │
│   📄 Safety Checklist Form                      │
│      By John Doe • Nov 11, 14:30      [View]    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ⏰ Step 2: Equipment Check      [IN_PROGRESS]   │
│   Type: form                                     │
│                                                  │
│   Assignment                                     │
│   [Assign to User ▼]                            │
│   ┌──────────────────────────┐                  │
│   │ Select a user...         │                  │
│   │ Jane Smith               │                  │
│   │ Bob Johnson              │                  │
│   └──────────────────────────┘                  │
│   [Assign] [Cancel]                              │
└──────────────────────────────────────────────────┘
```

### Execution Page (Assigned to You)

```
┌──────────────────────────────────────────────────┐
│ Daily Inspection - Site A                        │
│ Step 1: Safety Check                             │
│                    [IN_PROGRESS] [PENDING]       │
├──────────────────────────────────────────────────┤
│ Step 1 of 3                       33% complete   │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ 👤 Assigned to You                               │
│    John Doe (john@example.com)                   │
└──────────────────────────────────────────────────┘

[Form renders here...]
```

### Execution Page (Assigned to Someone Else)

```
┌──────────────────────────────────────────────────┐
│ ⚠️ Assigned to Another User                      │
│    Jane Smith (jane@example.com)                 │
│                                                  │
│ ⚠️ This step is assigned to another user.       │
│    You may not be able to complete it unless     │
│    you're a supervisor.                          │
└──────────────────────────────────────────────────┘
```

---

## 🔐 Permission Matrix

| Action | Unassigned | Assigned to Self | Assigned to Other | Supervisor |
|--------|-----------|------------------|-------------------|------------|
| View | ✅ | ✅ | ✅ | ✅ |
| Start | ✅ | ✅ | ❌ | ✅ |
| Complete | ✅ | ✅ | ❌ | ✅ |
| Assign | ❌ | ❌ | ❌ | ✅ |
| Unassign | ❌ | ❌ | ❌ | ✅ |

---

## 📊 Use Cases

### Use Case 1: Quality Control
**Scenario:** Final inspection must be done by certified inspector

**Solution:**
1. Create workflow with "Final Inspection" step
2. Assign that step to certified inspector
3. Other team members can't complete it
4. Ensures quality standards

### Use Case 2: Specialized Skills
**Scenario:** Electrical work requires licensed electrician

**Solution:**
1. Assign "Electrical Check" step to licensed electrician
2. Other operators complete other steps
3. Workflow blocked until electrician completes their step
4. Safety compliance maintained

### Use Case 3: Management Approval
**Scenario:** Supervisor must review before completion

**Solution:**
1. Assign final step to supervisor
2. Operators complete field work
3. Supervisor reviews and approves
4. Work order can't be marked complete without approval

### Use Case 4: Load Balancing
**Scenario:** Distribute work evenly across team

**Solution:**
1. View step assignments in management UI
2. See who has how many assigned steps
3. Reassign steps to balance workload
4. Monitor completion rates per person

---

## 🚀 Next Steps

### Immediate
1. Test the 3-minute flow above
2. Create a real work order with your team
3. Assign steps to actual team members
4. Monitor progress in real-time

### Advanced
1. Set up step assignment patterns for recurring workflows
2. Track step completion times to identify bottlenecks
3. Use submission data for quality metrics
4. Export step-level reports for analysis

---

## 📚 Full Documentation

For comprehensive details, see:
- **STEP-MANAGEMENT-COMPLETE.md** - Complete implementation guide
- **BACKEND-ARCHITECTURE.md** - API and database details
- **WORKFLOWS-COMPLETE.md** - Workflow system overview

---

## ✅ What's Working

- ✅ Step assignment to specific users
- ✅ Permission validation during execution
- ✅ Status tracking (PENDING/IN_PROGRESS/COMPLETED/SKIPPED)
- ✅ Completion timestamps and duration
- ✅ Submission linking to steps
- ✅ Supervisor progress monitoring
- ✅ Real-time updates
- ✅ Complete audit trail

## 🎉 Ready to Use!

The step management system is fully functional and ready for production use. Test it out with your team and see how it improves workflow accountability and visibility!

