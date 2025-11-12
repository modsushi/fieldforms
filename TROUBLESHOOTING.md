# Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Unknown field `assignedTo` for include statement"

**Error:**
```
Unknown field `assignedTo` for include statement on model `WorkOrderStep`.
```

**Cause:** Prisma client not regenerated after schema changes.

**Solution:**
```bash
cd /home/automato/code/fieldforms/packages/database
npm run db:generate
```

**Why:** When you modify the Prisma schema, you must regenerate the Prisma client to include the new fields and relations.

---

### Issue 2: "UNAUTHORIZED" errors on all tRPC calls

**Error:**
```
❌ tRPC failed on forms.getTemplates: UNAUTHORIZED
❌ tRPC failed on entities.getAll: UNAUTHORIZED
❌ tRPC failed on workOrders.list: UNAUTHORIZED
```

**Cause:** Invalid or expired JWT session token in browser.

**Solution:**

**Option 1: Clear Cookies (Recommended)**
1. Open browser DevTools (F12)
2. Go to Application tab
3. Expand Cookies
4. Delete `next-auth.session-token` cookie
5. Refresh page
6. Login again

**Option 2: Use Incognito/Private Window**
1. Open new incognito/private window
2. Navigate to `http://localhost:3000`
3. Login fresh

**Option 3: Clear All Browser Data**
1. Browser Settings → Privacy → Clear browsing data
2. Select "Cookies and other site data"
3. Clear for "Last hour"
4. Refresh and login

**Why:** After schema or auth changes, old JWT tokens may have invalid structure.

---

### Issue 3: "No steps" when filling work order

**Error:** Work order execution page shows no steps or empty form.

**Cause:** 
1. Workflow has no steps defined
2. `getProgress` endpoint returning undefined currentStep
3. Work order not properly created

**Solution:**

**Check 1: Verify Workflow Has Steps**
```bash
# Login as supervisor
Go to: /dashboard/workflows/{workflowId}
Verify: "Steps" section shows at least 1 step
```

**Check 2: Verify Work Order Created Correctly**
```bash
# Check work order detail
Go to: /dashboard/work-orders/{workOrderId}
Verify: "Workflow" field shows correct workflow name
```

**Check 3: Check Browser Console**
```bash
# Open DevTools (F12)
# Go to Console tab
# Look for errors related to:
- getProgress query
- workflow.definition
- currentStep
```

**Check 4: Verify Database**
```sql
-- Check if workflow has definition
SELECT id, name, definition FROM workflows WHERE id = 'your-workflow-id';

-- Check if work order exists
SELECT id, title, workflow_id, current_step_index FROM work_orders WHERE id = 'your-work-order-id';
```

**Fixed:** The `getProgress` endpoint now falls back to workflow definition if no step records exist yet.

---

### Issue 4: "Cannot read properties of undefined (reading 'steps')"

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'steps')
```

**Cause:** Workflow definition is null or malformed.

**Solution:**

**Fix 1: Recreate Workflow**
```bash
# Delete problematic workflow
Go to: /dashboard/workflows
Click: Delete on the workflow

# Create new workflow
Go to: /dashboard/workflows/new
Add at least 1 step
Save
```

**Fix 2: Check Workflow Definition Structure**
```typescript
// Correct structure:
{
  "steps": [
    {
      "id": "step-1",
      "name": "Step Name",
      "type": "form",
      "config": {
        "formTemplateId": "form-uuid"
      }
    }
  ]
}
```

---

### Issue 5: Forms not showing in workflow creation

**Error:** Form template dropdown is empty when creating workflow.

**Cause:** No form templates exist or not loaded.

**Solution:**

**Check 1: Seed Forms**
```bash
cd /home/automato/code/fieldforms/packages/database
npm run db:seed:forms
```

**Check 2: Create Form Manually**
```bash
Go to: /dashboard/forms/builder
Create a simple form
Publish it
Try workflow creation again
```

**Check 3: Check API Response**
```bash
# Open DevTools → Network tab
# Look for: forms.getTemplates
# Check response has items array
```

---

### Issue 6: "Step is assigned to another user" but I'm a supervisor

**Error:** Supervisor can't complete step assigned to operator.

**Cause:** This is actually expected behavior in some cases, but supervisors SHOULD be able to override.

**Solution:**

**Check:** Verify you're logged in as supervisor
```bash
# Check session
Open DevTools → Console
Type: window.localStorage
Look for session data
Verify role: "SUPERVISOR"
```

**If role is correct but still blocked:**
This is a bug. The `completeStep` endpoint should allow supervisors to override.

**Workaround:**
1. Unassign the step first (as supervisor)
2. Complete it
3. Or reassign it to yourself

---

### Issue 7: Database connection errors

**Error:**
```
Can't reach database server at `localhost:5432`
```

**Cause:** PostgreSQL not running.

**Solution:**

**Start Docker Services:**
```bash
cd /home/automato/code/fieldforms
docker-compose up -d
```

**Verify Services Running:**
```bash
docker-compose ps

# Should show:
# postgres - Up
# redis - Up
# minio - Up
```

**Check Logs:**
```bash
docker-compose logs postgres
```

---

### Issue 8: "Workflow not found" when creating work order

**Error:** Can't select workflow in work order creation.

**Cause:** 
1. No workflows exist
2. Workflows not active
3. Wrong organization

**Solution:**

**Create Workflow:**
```bash
Go to: /dashboard/workflows/new
Create workflow with steps
Make sure "Active" is checked
Save
```

**Check Workflow List:**
```bash
Go to: /dashboard/workflows
Verify workflows appear
Check "Active" status
```

---

### Issue 9: Submissions not appearing in step view

**Error:** Step shows "No submissions yet" even after completing.

**Cause:** Submission not linked to step.

**Solution:**

**Check:** Verify submission has `workOrderStepId`
```sql
SELECT id, work_order_id, work_order_step_id 
FROM form_submissions 
WHERE work_order_id = 'your-work-order-id';
```

**Fix:** Use the new `completeStep` endpoint instead of just `submitForm`:
```typescript
// OLD (doesn't link to step):
await submitFormMutation.mutateAsync({ ... });

// NEW (links to step):
const submission = await submitFormMutation.mutateAsync({ 
  ...
  workOrderStepId: stepId 
});
await completeStepMutation.mutateAsync({
  workOrderId,
  stepIndex,
  submissionId: submission.id
});
```

---

### Issue 10: Dev server not starting

**Error:**
```
Port 3000 is already in use
```

**Solution:**

**Kill Process on Port:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or find and kill manually
lsof -i:3000
kill -9 <PID>
```

**Start Fresh:**
```bash
cd /home/automato/code/fieldforms
npm run dev
```

---

## Quick Fixes Checklist

When something breaks, try these in order:

1. ✅ **Clear browser cookies** (most common fix)
2. ✅ **Regenerate Prisma client** (`npm run db:generate`)
3. ✅ **Restart dev server** (Ctrl+C, then `npm run dev`)
4. ✅ **Check Docker services** (`docker-compose ps`)
5. ✅ **Check browser console** (F12 → Console tab)
6. ✅ **Check network tab** (F12 → Network tab)
7. ✅ **Verify database** (connect with psql or TablePlus)
8. ✅ **Check server logs** (terminal running `npm run dev`)

---

## Environment Variables Checklist

Make sure these files exist and have correct values:

### `/home/automato/code/fieldforms/packages/database/.env`
```env
DATABASE_URL="postgresql://fieldform:fieldform@localhost:5432/fieldform?schema=public"
```

### `/home/automato/code/fieldforms/apps/web/.env.local`
```env
DATABASE_URL="postgresql://fieldform:fieldform@localhost:5432/fieldform?schema=public"
NEXTAUTH_SECRET="your-secret-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Database Reset (Nuclear Option)

If everything is broken, reset the database:

```bash
# WARNING: This deletes ALL data!

# Stop services
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for postgres to start (10 seconds)
sleep 10

# Push schema
cd packages/database
npm run db:push

# Seed data
npm run db:seed
npm run db:seed:forms

# Regenerate client
npm run db:generate

# Restart dev server
cd ../..
npm run dev
```

---

## Getting Help

### Check Logs

**Server Logs:**
```bash
# Terminal running npm run dev
# Look for errors in red
```

**Browser Console:**
```bash
# F12 → Console tab
# Look for red errors
```

**Database Logs:**
```bash
docker-compose logs postgres
```

### Debug Mode

**Enable tRPC Logging:**
```typescript
// apps/web/src/trpc/client.ts
// Add to createTRPCProxyClient options:
loggerLink({
  enabled: (opts) => true,
}),
```

**Enable Prisma Query Logging:**
```typescript
// packages/database/src/index.ts
export const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Common Gotchas

### 1. Async/Await
Always await mutations:
```typescript
// ❌ Wrong
submitFormMutation.mutateAsync({ ... });

// ✅ Correct
await submitFormMutation.mutateAsync({ ... });
```

### 2. Session Structure
After auth changes, always clear cookies:
```bash
# Schema changes → Clear cookies
# Auth changes → Clear cookies
# Role changes → Clear cookies
```

### 3. Prisma Client
After schema changes, always regenerate:
```bash
npm run db:push
npm run db:generate
```

### 4. TypeScript Errors
If types are wrong, regenerate Prisma:
```bash
cd packages/database
npm run db:generate
cd ../..
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "Restart TS Server"
```

---

## Still Stuck?

1. Check the documentation:
   - STEP-MANAGEMENT-QUICK-START.md
   - STEP-MANAGEMENT-COMPLETE.md
   - BACKEND-ARCHITECTURE.md

2. Test with provided test users:
   - Supervisor: `admin@test.com` / `password`
   - Operator: `operator@test.com` / `password`

3. Start with a fresh database (see Database Reset above)

4. Check GitHub issues (if applicable)

5. Review recent changes in git history


