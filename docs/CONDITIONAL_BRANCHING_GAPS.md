# Conditional Branching Implementation - Gap Analysis

## Overview
After auditing the conditional branching implementation, here are all the missing pieces and issues that need to be addressed for it to work properly.

---

## 🚨 Critical Issues (Blocks Functionality)

### 1. **No Step Data Collection for Condition Evaluation**
**Problem:** `getProgress` doesn't return `stepData` which the ConditionalStepRenderer needs to evaluate conditions.

**Location:** `/apps/web/src/server/api/routers/work-orders.ts:351`

**Current Code:**
```typescript
return {
  workOrder: { ... },
  progress: { ... },
  currentStep: currentStepDef,
  currentStepRecord,
  workflow: workOrder.workflow,
  // ❌ Missing: stepData
};
```

**What's Needed:**
```typescript
// Build stepData map from completed steps
const stepData: Record<string, any> = {};
workOrder.steps
  .filter(s => s.status === 'COMPLETED')
  .forEach(step => {
    const stepDef = workflowSteps[step.stepIndex];
    if (stepDef && step.data) {
      stepData[stepDef.id] = step.data;
    }
  });

return {
  // ... existing fields
  stepData, // ✅ Add this
};
```

**Impact:** ConditionalStepRenderer crashes with "Cannot read properties of undefined (reading 'sourceStepId')"

---

### 2. **completeStep Doesn't Support Conditional Steps**
**Problem:** `completeStep` requires a `submissionId`, but conditional steps don't have form submissions. It also doesn't accept `metadata` for branch decisions.

**Location:** `/apps/web/src/server/api/routers/work-orders.ts:701`

**Current Input Schema:**
```typescript
z.object({
  workOrderId: z.string(),
  stepIndex: z.number(),
  submissionId: z.string(), // ❌ Required but conditionals have none
})
```

**What's Needed:**
```typescript
z.object({
  workOrderId: z.string(),
  stepIndex: z.number(),
  submissionId: z.string().optional(), // ✅ Make optional
  metadata: z.record(z.any()).optional(), // ✅ Add for branch decisions
  stepType: z.enum(['form', 'conditional', 'iterator', 'location-marker']).optional(),
})
```

**Backend Logic Update:**
```typescript
// Handle conditional steps differently
if (input.stepType === 'conditional') {
  // No submission verification
  // Store metadata (branchIndex, branchTaken)
  await ctx.db.workOrderStep.update({
    where: { id: step.id },
    data: {
      status: 'COMPLETED',
      data: input.metadata, // Store branch decision
      completedAt: new Date(),
      completedById: userId,
    },
  });
} else {
  // Existing form step logic
}
```

---

### 3. **No Branch Step Execution**
**Problem:** When a conditional step selects a branch, the steps in that branch (`nextSteps`) are never executed. The workflow just moves to the next top-level step.

**Location:** `/apps/web/src/server/api/routers/work-orders.ts:806`

**Current Code:**
```typescript
// Move to next step
await ctx.db.workOrder.update({
  where: { id: input.workOrderId },
  data: {
    currentStepIndex: input.stepIndex + 1, // ❌ Just increments by 1
    status: 'IN_PROGRESS',
  },
});
```

**What's Needed:**
The workflow needs to be "flattened" when a branch is taken. Options:

**Option A: Dynamic Flattening** (Complex but flexible)
- When a conditional step completes, inject its branch steps into an execution queue
- Maintain a separate `executionQueue` in work order
- Track `currentQueueIndex` instead of `currentStepIndex`

**Option B: Static Expansion** (Simpler but limited)
- When creating the work order, expand all possible branches
- Mark unused branches as SKIPPED when a different branch is taken
- Problem: Doesn't handle deeply nested conditions well

**Recommended: Option A**

---

### 4. **completeStep Requires submissionId Verification**
**Problem:** Line 761 tries to verify submission exists, but conditional steps don't have submissions.

**Location:** `/apps/web/src/server/api/routers/work-orders.ts:761`

**Current Code:**
```typescript
// Verify submission exists and belongs to this work order
const submission = await ctx.db.formSubmission.findFirst({
  where: {
    id: input.submissionId, // ❌ Will be undefined for conditionals
    workOrderId: input.workOrderId,
  },
});

if (!submission) {
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Submission not found' });
}
```

**Fix:**
```typescript
// Only verify submission for form steps
if (input.submissionId) {
  const submission = await ctx.db.formSubmission.findFirst({
    where: {
      id: input.submissionId,
      workOrderId: input.workOrderId,
    },
  });

  if (!submission) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Submission not found' });
  }
}
```

---

## ⚠️ Important Issues (Causes Incorrect Behavior)

### 5. **Progress Calculation Ignores Branch Steps**
**Problem:** Progress only counts top-level workflow steps, not steps within branches.

**Location:** `/apps/web/src/server/api/routers/work-orders.ts:384`

**Current Code:**
```typescript
const totalSteps = workflowSteps.length; // ❌ Only top-level steps
```

**Impact:** Progress bar shows 50% when you're actually at 25% because branch steps aren't counted.

**Fix Needed:**
Recursive function to count all possible steps:
```typescript
function countAllSteps(steps: WorkflowStep[]): number {
  let count = 0;
  for (const step of steps) {
    count++; // Count this step
    if (step.type === 'conditional') {
      // Count steps in all branches
      step.config.branches.forEach(branch => {
        count += countAllSteps(branch.nextSteps);
      });
      if (step.config.defaultBranch) {
        count += countAllSteps(step.config.defaultBranch);
      }
    }
  }
  return count;
}
```

**Problem:** This counts ALL possible branch steps, even ones not taken. Need to track which branch was actually taken.

---

### 6. **WorkflowEngine Not Used**
**Problem:** There's a complete `WorkflowEngine` class with `evaluateConditionalBranch()` but it's never used by the backend.

**Location:** `/apps/web/src/lib/workflow/engine.ts`

**What Exists:**
- ✅ `evaluateConditionalBranch()` - Evaluates conditions
- ✅ `evaluateCondition()` - Handles all operators
- ✅ `getNextStep()` - Gets next step in workflow
- ✅ `completeStep()` - Different from the tRPC endpoint

**What's Missing:**
- Integration with the tRPC endpoints
- The engine's `completeStep` isn't called by the API's `completeStep`

---

## 📋 Medium Priority Issues

### 7. **No Validation**
**Missing:**
- No validation that sourceStepId exists
- No validation that fieldId exists in source form
- No cycle detection (branch that loops back to itself)
- No validation that branch steps are valid

**Where to Add:** Create a workflow validator that runs when saving a workflow.

---

### 8. **No Step Type Indicators in Database**
**Problem:** WorkOrderStep doesn't store what type of step it is (form, conditional, iterator, etc.)

**Current Schema:**
```prisma
model WorkOrderStep {
  id                String        @id @default(cuid())
  stepDefinitionId  String        // Just an ID
  // ❌ No stepType field
}
```

**Impact:** Hard to query "show me all conditional steps" or handle them differently.

---

### 9. **ConditionalStepRenderer Auto-Completes Too Fast**
**Problem:** The renderer shows the result for 1.5 seconds then auto-completes. If there's an error or the user wants to review, too bad.

**Location:** `/apps/web/src/components/workflow/steps/conditional-step-renderer.tsx:66`

**Current:**
```typescript
setTimeout(() => {
  onComplete({ branchIndex: matchedBranch, branchTaken: matchedBranch });
}, 1500); // ❌ Hardcoded delay
```

**Better:** Add a "Continue" button so user can review the decision before proceeding.

---

### 10. **No Branch Path Visualization**
**Missing:** Operators can't see which path was taken in completed work orders. Should show:
- "Step 2: Conditional Branch → Took Branch 1 (Status = Failed)"
- Visual tree of which steps were executed vs skipped

---

### 11. **No "equals" Operator Type Coercion**
**Problem:** In the engine, `equals` uses strict equality (`===`), but our form data might have type mismatches.

**Location:** `/apps/web/src/lib/workflow/engine.ts:242`

**Example Issue:**
- Condition value: `true` (boolean)
- Form data: `"true"` (string)
- Result: Doesn't match ❌

**Fix:** Use loose equality (`==`) or add type coercion:
```typescript
case 'equals':
  // Add type coercion
  if (typeof value === 'boolean' || typeof conditionValue === 'boolean') {
    return Boolean(value) === Boolean(conditionValue);
  }
  return value == conditionValue; // Loose equality
```

---

### 12. **Nested Conditionals Not Tested**
**Issue:** What happens if a branch contains another conditional step? Does it work?

**Test Case Needed:**
```
Step 1: Form (Status field)
Step 2: Conditional on Status
  ├─ If "Failed"
  │   └─ Step 3: Form (Severity field)
  │   └─ Step 4: Conditional on Severity  ← NESTED
  │       ├─ If "Critical" → Emergency form
  │       └─ If "Minor" → Standard form
  └─ If "Pass"
      └─ Done
```

---

## 🔄 Architectural Concerns

### 13. **Workflow Definition is Immutable**
**Issue:** The workflow definition is stored as JSON and defines a tree structure. When a branch is taken, we can't modify it—we need a separate execution state.

**Problem:**
- Workflow definition: Static tree structure
- Execution: Dynamic linear sequence that changes based on branches

**Solution Needed:**
- Execution queue separate from workflow definition
- Track which steps were taken vs available

---

### 14. **Multiple Operators Can Fill Same Form**
**Concern:** If a conditional branch has 3 forms and operator A completes form 1, can operator B complete form 2?

**Current State:** Unclear. Step assignment is at the step level, but branch steps aren't exposed as individual assignable steps.

---

## 📊 Summary Matrix

| Issue | Severity | Blocks Execution? | Estimated Fix Time |
|-------|----------|-------------------|-------------------|
| No stepData in getProgress | 🔴 Critical | Yes | 1 hour |
| completeStep needs optional submissionId | 🔴 Critical | Yes | 2 hours |
| No branch step execution | 🔴 Critical | Yes | 1-2 days |
| completeStep doesn't accept metadata | 🔴 Critical | Yes | 1 hour |
| Progress calculation wrong | 🟡 Important | No | 4 hours |
| WorkflowEngine not integrated | 🟡 Important | No | 1 day |
| No validation | 🟡 Important | No | 1 day |
| Type coercion in equals | 🟠 Medium | Partially | 1 hour |
| Auto-complete too fast | 🟠 Medium | No | 2 hours |
| No path visualization | 🔵 Nice-to-have | No | 1 day |

---

## 🎯 Recommended Fix Order

### Phase 1: Make It Work (3-5 days)
1. Add stepData to getProgress response
2. Make submissionId optional in completeStep
3. Add metadata support to completeStep
4. Implement branch step execution (biggest task)
5. Fix equals operator type coercion

### Phase 2: Make It Correct (2-3 days)
6. Fix progress calculation
7. Integrate WorkflowEngine properly
8. Add workflow validation

### Phase 3: Polish (2-3 days)
9. Add branch path visualization
10. Improve conditional step renderer UX
11. Test nested conditionals
12. Add step type to database

---

## 💡 Key Architectural Decision Needed

**How should branch steps be executed?**

Three options:

**A. Execution Queue (Recommended)**
- Maintain a separate execution queue that gets populated as branches are taken
- Pro: Flexible, handles nested conditionals
- Con: More complex to implement

**B. Pre-expand All Paths**
- When creating work order, create step records for ALL possible paths
- Mark unused paths as SKIPPED when branch is taken
- Pro: Simple queries, standard step management
- Con: Creates many unused step records, doesn't scale with deeply nested conditions

**C. Hybrid: Lazy Expansion**
- Start with top-level steps
- When conditional is reached, dynamically create step records for taken branch
- Pro: Balance of simplicity and flexibility
- Con: Step indices become non-sequential

**Recommendation:** Option C (Lazy Expansion) - Best balance of complexity and functionality.

---

This analysis should give you a complete picture of what's needed to make conditional branching fully functional.
