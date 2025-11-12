# Work Order Execution Guide

## Overview

This guide explains how to execute work orders step-by-step through the application, from creation to completion.

## Architecture

### Components

1. **Work Order Creation** (`/dashboard/work-orders/new`)
   - Supervisors create work orders linked to workflows
   - Assign to teams, set priority, due dates
   
2. **Work Order Detail** (`/dashboard/work-orders/[id]`)
   - View work order details, progress, submissions
   - **NEW:** "Start Work" / "Continue Work" button to execute steps
   - Claim/unclaim, assign/reassign functionality
   
3. **Work Order Execution** (`/operator/work-order/[id]`)
   - Step-by-step form filling interface
   - Progress tracking with visual indicators
   - Automatic progression through workflow steps
   
4. **Operator Dashboard** (`/operator`)
   - Shows claimed work orders
   - Shows available team work orders
   - "Work On This →" button for quick access

### Workflow Engine

The workflow execution engine (`/lib/workflow/engine.ts`) handles:
- Step progression logic
- Form step rendering
- Conditional branching (planned)
- Iterator loops (planned)
- Location marker steps (planned)

---

## Complete Walkthrough

### Step 1: Create a Workflow

**As Supervisor (admin@test.com):**

1. Go to `/dashboard/workflows/new`
2. Fill in workflow details:
   ```
   Name: Site Inspection Workflow
   Description: Daily safety inspection for construction sites
   ```
3. Add steps:
   - **Step 1: Safety Check**
     - Type: Form Step
     - Select form template: "Safety Inspection"
   - **Step 2: Equipment Check**
     - Type: Form Step
     - Select form template: "Equipment Maintenance Report"
4. Click "Create Workflow"

### Step 2: Create a Work Order

**As Supervisor:**

1. Go to `/dashboard/work-orders/new`
2. Fill in work order details:
   ```
   Title: Daily Inspection - Site A
   Description: Complete safety and equipment inspection
   Workflow: Site Inspection Workflow (select from dropdown)
   Priority: Medium
   Assign to Team: Field Team 1 (optional)
   Due Date: Today + 1 day
   ```
3. Click "Create Work Order"
4. You'll be redirected to the work order detail page

### Step 3: Start Work Order Execution

**Option A - From Work Order Detail Page:**

1. On the work order detail page (`/dashboard/work-orders/[id]`)
2. Look for the **"🚀 Start Work"** button in the Actions card (right sidebar)
3. Click it to navigate to the execution interface

**Option B - From Operator Dashboard:**

1. Login as operator (`operator@test.com`)
2. Go to `/operator` (or it might redirect automatically)
3. See work orders in two sections:
   - **My Active Work**: Work orders you've claimed
   - **Available to My Team**: Unclaimed work orders
4. Click **"Claim"** to claim a work order
5. Click **"Work On This →"** to start execution

### Step 4: Execute Workflow Steps

**On Execution Page (`/operator/work-order/[id]`):**

#### Header
- Shows work order title
- Shows current step name
- Status badge (PENDING → IN_PROGRESS → COMPLETED)
- **Progress bar** showing step completion percentage

#### Current Step Display
- Step title and description
- Entity context (if form is linked to an entity)
- Form fields based on the form template

#### Form Filling
1. Fill out all required fields in the current step
2. Optional fields can be skipped
3. Upload photos, capture location, etc. (depending on field types)
4. Click **"Submit"** button at the bottom

#### After Submission
- Form data is saved as a submission
- System automatically moves to the next step
- Progress bar updates
- If it was the last step:
  - Work order status changes to `COMPLETED`
  - You're redirected to `/operator` dashboard
  - Success message: "Work order completed! Great job!"

### Step 5: Monitor Progress

**As Supervisor:**

1. Go to `/dashboard/work-orders/[id]`
2. See the **Progress Card**:
   - Shows "X of Y steps completed"
   - Visual progress bar with percentage
3. See **Form Submissions** section:
   - Lists all submitted forms
   - Shows submitter name and timestamp
   - Click to view detailed submission

**As Operator:**

- Continue button appears if work was interrupted
- Progress bar shows how much is left
- Can refresh to see latest status

---

## API Endpoints Used

### Work Orders
- `workOrders.create` - Create new work order
- `workOrders.getById` - Get work order details
- `workOrders.list` - List work orders (filtered by role)
- `workOrders.getProgress` - Get current step and progress
- `workOrders.claim` - Claim a work order
- `workOrders.unclaim` - Release a work order
- `workOrders.updateStatus` - Update work order status

### Forms
- `forms.getTemplate` - Get form template for step
- `forms.submitForm` - Submit completed form
- `forms.getSubmission` - View submission details

### Workflows
- `workflows.list` - Get available workflows
- `workflows.getById` - Get workflow definition

---

## Current Step Types

### ✅ Form Step (Implemented)
- Renders a form template
- Supports all field types (text, number, select, photo, location, etc.)
- Conditional field visibility
- Validation rules
- Entity linking

### 🚧 Conditional Step (Planned)
- Branch workflow based on form data
- "If X, then go to step Y, else step Z"
- Use case: Skip steps based on inspection results

### 🚧 Iterator Step (Planned)
- Loop over multiple entities/sites
- Fill same form for each item
- Progress tracking per iteration

### 🚧 Location Marker Step (Planned)
- Drop markers on a map
- Fill form for each marker
- Use case: Survey multiple locations

---

## Example Workflows

### 1. Simple Linear Inspection
```
Step 1: Pre-inspection checklist (Form)
Step 2: Main inspection (Form)
Step 3: Post-inspection notes (Form)
→ Complete
```

### 2. Conditional Maintenance (Planned)
```
Step 1: Equipment check (Form)
Step 2: Conditional - Issue found?
  → Yes: Go to Step 3 (Detailed report)
  → No: Skip to completion
Step 3: Issue documentation (Form)
→ Complete
```

### 3. Multi-Site Survey (Planned)
```
Step 1: Survey planning (Form)
Step 2: Iterator - For each site:
  → Site inspection form
Step 3: Summary report (Form)
→ Complete
```

---

## Data Flow

```
1. Supervisor creates Work Order
   ↓
2. Work Order created with:
   - workflowId (defines the steps)
   - currentStepIndex = 0
   - status = PENDING
   ↓
3. Operator claims work order
   - claimedById = operator's userId
   ↓
4. Operator starts execution
   - Status → IN_PROGRESS
   - Loads workflow definition
   - Fetches current step (index 0)
   ↓
5. Operator fills form (Step 1)
   - Form data submitted
   - FormSubmission created with workOrderId
   - currentStepIndex → 1
   ↓
6. Repeat for each step
   ↓
7. Last step completed
   - Status → COMPLETED
   - completedAt timestamp set
```

---

## Database Schema (Relevant Tables)

### WorkOrder
- `id`, `orgId`, `title`, `description`
- `status`: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
- `priority`: LOW | MEDIUM | HIGH | URGENT
- `workflowId`: Links to Workflow
- `currentStepIndex`: Current position in workflow
- `assignedToTeamId`, `claimedById`
- `dueDate`, `completedAt`

### Workflow
- `id`, `orgId`, `name`, `description`
- `definition`: JSON containing step definitions
- `isActive`: Whether workflow can be used

### FormSubmission
- `id`, `formTemplateId`, `submitterId`
- `data`: JSON of form field values
- `workOrderId`: Links submission to work order
- `workOrderStepId`: Links to specific step
- `submittedAt`, `deviceInfo`, `location`

---

## Troubleshooting

### "No workflows found" in work order creation
- **Solution**: First create a workflow in `/dashboard/workflows/new`
- Workflows must have at least one step
- Only active workflows appear in the list

### "No active step found"
- **Cause**: Workflow definition might be malformed
- **Solution**: Check that workflow has `definition.steps` array
- Each step needs: `id`, `name`, `type`, `config`

### Form not rendering in execution
- **Cause**: Form template ID might be invalid
- **Solution**: Verify `formTemplateId` in step config
- Check form template exists in `/dashboard/forms`

### Progress not updating
- **Cause**: Form submission might have failed
- **Solution**: Check browser console for errors
- Verify network requests in DevTools
- Click "🔄 Refresh" button to reload

---

## Testing Guide

### Complete Test Flow

1. **Setup**
   ```bash
   # Make sure database is seeded
   cd packages/database
   npm run db:seed
   npm run db:seed:forms
   ```

2. **Login as Supervisor**
   - Email: `admin@test.com`
   - Password: `password`

3. **Create Team** (if not exists)
   - Go to `/dashboard/teams`
   - Create "Field Team 1"
   - Add operator user as member

4. **Create Workflow**
   - Go to `/dashboard/workflows/new`
   - Add 2-3 form steps
   - Use sample forms from seed

5. **Create Work Order**
   - Go to `/dashboard/work-orders/new`
   - Select your workflow
   - Assign to team
   - Submit

6. **Login as Operator**
   - Email: `operator@test.com`
   - Password: `password`

7. **Claim and Execute**
   - Go to `/operator`
   - Claim the work order
   - Click "Work On This →"
   - Fill out each form step
   - Complete workflow

8. **Verify as Supervisor**
   - Login as admin again
   - Go to work order detail
   - Check progress is 100%
   - View form submissions
   - Export PDF/CSV report

---

## Next Steps

### Immediate Enhancements
- [ ] Add step navigation (back/forward buttons)
- [ ] Save draft progress (partial form completion)
- [ ] Offline execution support
- [ ] Step comments/notes

### Advanced Features
- [ ] Conditional step implementation
- [ ] Iterator step for multi-entity workflows
- [ ] Location marker step with map
- [ ] Photo gallery for step documentation
- [ ] Real-time collaboration (multiple operators)
- [ ] Step-level time tracking

### Reporting
- [ ] Enhanced PDF reports with photos
- [ ] Excel export with multiple sheets per step
- [ ] Automated email reports on completion
- [ ] Dashboard analytics per workflow type

---

## UI Improvements

### Current State
✅ Progress bar with percentage
✅ Step counter (X of Y)
✅ Status badges
✅ "Start Work" / "Continue Work" buttons
✅ Operator dashboard with claim system

### Planned
- Step timeline view (past/current/future)
- Estimated time per step
- Pause/resume functionality
- Step completion confirmation
- Inline validation feedback
- Mobile-optimized execution view

---

## Security & Permissions

### Supervisor Capabilities
- Create/edit/delete workflows
- Create/assign work orders
- View all work orders in organization
- Reassign work between teams
- Manually mark work orders complete/cancelled
- Export reports

### Operator Capabilities
- View assigned team's work orders
- Claim unclaimed work orders
- Execute claimed work orders (fill forms)
- View own submissions
- **Cannot:** Reassign, delete, or manually change status

### Data Isolation
- All queries filtered by `orgId`
- Operators only see their team's work
- Submissions linked to specific work orders
- Audit trail via `createdBy`, `claimedBy` fields

---

## Performance Considerations

### Current Implementation
- Client-side form rendering
- Single-page step execution
- Real-time progress updates
- Optimistic UI updates with refetch

### Optimizations Needed
- Lazy load form templates
- Cache workflow definitions
- Batch submission uploads
- Background sync for offline mode
- Pagination for work order lists

---

## Success! 🎉

You now have a complete work order execution system with:
- Workflow-based task management
- Step-by-step form filling
- Progress tracking
- Role-based access control
- Supervisor oversight
- Operator execution interface

**Test it out** and you'll see the complete field operations workflow in action!

