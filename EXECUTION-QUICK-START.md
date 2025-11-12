# Quick Start: Work Order Execution

## 🎯 TL;DR

Work orders can now be executed step-by-step! Here's how:

## ⚡ 5-Minute Test

### 1. Login as Supervisor
```
Email: admin@test.com
Password: password
```

### 2. Create a Workflow
- Go to: `/dashboard/workflows/new`
- Name: "Test Inspection"
- Add Step 1: Form Step → Select any form template
- Click "Create Workflow"

### 3. Create a Work Order
- Go to: `/dashboard/work-orders/new`
- Title: "My First Work Order"
- Workflow: Select "Test Inspection"
- Click "Create Work Order"

### 4. Execute It!

**Option A - Stay as Supervisor:**
- On work order detail page
- Click **"🚀 Start Work"** button (right sidebar, Actions card)
- Fill out the form
- Click Submit

**Option B - Use Operator:**
- Login as: `operator@test.com` / `password`
- Go to: `/operator`
- Click "Claim" on available work order
- Click **"Work On This →"**
- Fill out the form
- Click Submit

### 5. See Results
- Work order status → COMPLETED ✅
- View submissions in work order detail
- Export PDF/CSV report

---

## 📍 Key Pages

| Role | Page | URL | Purpose |
|------|------|-----|---------|
| Supervisor | Workflows List | `/dashboard/workflows` | View all workflows |
| Supervisor | Create Workflow | `/dashboard/workflows/new` | Build multi-step workflows |
| Supervisor | Work Orders List | `/dashboard/work-orders` | Monitor all work |
| Supervisor | Create Work Order | `/dashboard/work-orders/new` | Assign new tasks |
| Supervisor | Work Order Detail | `/dashboard/work-orders/[id]` | View progress, **Start Work** |
| Operator | Dashboard | `/operator` | Claim & view work |
| **Anyone** | **Execute Work Order** | `/operator/work-order/[id]` | **Step-by-step execution** |

---

## 🔑 Key Features

### Work Order Execution Page
- ✅ Step-by-step progression
- ✅ Progress bar (visual & percentage)
- ✅ Form rendering with all field types
- ✅ Auto-advance to next step
- ✅ Auto-complete when last step done
- ✅ Entity context display
- ✅ Mobile-friendly

### Navigation to Execution
1. **Work Order Detail** → "Start Work" / "Continue Work" button
2. **Operator Dashboard** → "Work On This →" button
3. **Direct Link** → `/operator/work-order/{workOrderId}`

---

## 🚀 What Was Added

### New UI Elements

**In `/dashboard/work-orders/[id]/page.tsx`:**
```tsx
// Actions Card - NEW BUTTON!
{workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && (
  <Button
    className="w-full"
    onClick={() => router.push(`/operator/work-order/${id}`)}
  >
    🚀 {workOrder.status === 'PENDING' ? 'Start Work' : 'Continue Work'}
  </Button>
)}
```

### Existing Components (Already Built!)
- ✅ `/operator/work-order/[id]/page.tsx` - Main execution interface
- ✅ `/components/workflow/steps/form-step.tsx` - Form step renderer
- ✅ `/components/form-renderer/form-renderer.tsx` - Dynamic form display
- ✅ Workflow engine with step progression
- ✅ Progress tracking API

---

## 🎨 UI Flow

```
┌─────────────────────────────────────┐
│  Work Order Detail Page             │
│  /dashboard/work-orders/[id]        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Actions Card                │   │
│  │  🚀 Start Work              │◄──┼─ Click this!
│  │  Mark In Progress           │   │
│  │  Mark Completed             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Work Order Execution               │
│  /operator/work-order/[id]          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Step 1 of 3                 │   │
│  │ ████████░░░░░░░░░░░░ 33%   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Step Title & Description    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Form Fields                 │   │
│  │ • Text Input                │   │
│  │ • Number Input              │   │
│  │ • Photo Upload              │   │
│  │ • Location Capture          │   │
│  │                             │   │
│  │ [Submit]                    │◄──┼─ Fill & Submit
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
         Auto-advance to Step 2
                 ↓
         Repeat for all steps
                 ↓
┌─────────────────────────────────────┐
│  ✅ Work Order Completed!           │
│                                     │
│  Redirect to /operator              │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

- [ ] Create workflow with multiple steps
- [ ] Create work order using that workflow
- [ ] Click "Start Work" button (appears in sidebar)
- [ ] See step 1 form rendered
- [ ] Fill and submit step 1
- [ ] Verify auto-advance to step 2
- [ ] Complete all steps
- [ ] Verify work order marked COMPLETED
- [ ] Check submissions appear in work order detail
- [ ] Test as both supervisor and operator

---

## 🐛 Common Issues

### "Start Work" button not showing
- **Check:** Work order status
- **Fix:** Button only shows for PENDING/IN_PROGRESS status

### "No active step found"
- **Check:** Workflow has steps in definition
- **Fix:** Re-create workflow with at least one form step

### Form not rendering
- **Check:** Form template exists
- **Check:** Step config has valid `formTemplateId`
- **Fix:** Edit workflow to select valid form

### Not auto-advancing
- **Check:** Browser console for errors
- **Check:** Form submission succeeded
- **Fix:** Verify all required fields filled

---

## 📝 Example Workflow Definition

When you create a workflow in the UI, it saves this structure:

```json
{
  "steps": [
    {
      "id": "step-1",
      "name": "Safety Check",
      "type": "form",
      "description": "Complete safety inspection",
      "config": {
        "formTemplateId": "uuid-of-form-template",
        "allowOffline": true
      }
    },
    {
      "id": "step-2",
      "name": "Equipment Check",
      "type": "form",
      "config": {
        "formTemplateId": "uuid-of-another-form"
      }
    }
  ]
}
```

The execution engine loads this and renders each step sequentially.

---

## 🎉 Success Metrics

After following this guide, you should see:
- ✅ Workflows created and listed
- ✅ Work orders created with workflow
- ✅ "Start Work" button visible
- ✅ Step-by-step execution working
- ✅ Progress bar updating
- ✅ Forms submitting successfully
- ✅ Work orders completing
- ✅ Submissions linked to work orders

**You're all set!** The complete work order execution system is ready to use.

---

## 📚 Full Documentation

For comprehensive details, see:
- **WORK-ORDER-EXECUTION.md** - Complete guide with architecture, data flow, and advanced features
- **BACKEND-ARCHITECTURE.md** - API endpoints and database schema
- **WORKFLOWS-COMPLETE.md** - Workflow system implementation details

