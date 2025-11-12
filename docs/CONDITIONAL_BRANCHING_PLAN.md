# Conditional Branching Plan for Workflow Forms

**Version:** 1.0
**Date:** 2025-11-12
**Status:** Planning

## Executive Summary

This document outlines a comprehensive plan to implement conditional branching of forms within the workflow system. The infrastructure for conditional logic evaluation already exists in the codebase. This plan focuses on completing the UI components, integration with the workflow builder, and execution engine enhancements.

## Table of Contents

1. [Background](#background)
2. [Current State](#current-state)
3. [Goals & Objectives](#goals--objectives)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Plan](#implementation-plan)
6. [User Experience](#user-experience)
7. [Testing Strategy](#testing-strategy)
8. [Risks & Mitigation](#risks--mitigation)
9. [Success Metrics](#success-metrics)

---

## Background

### Problem Statement

Users need the ability to create dynamic workflows where the next step depends on data collected in previous form submissions. For example:
- If a safety inspection fails, assign a follow-up repair form
- If equipment condition is "critical", escalate to urgent maintenance
- Route different types of incidents to specialized investigation forms

### Current Limitations

- Workflows currently execute steps in a fixed linear sequence
- No ability to define branching paths based on form data
- All conditional logic is limited to field-level visibility within forms
- Operators must manually choose follow-up actions outside the workflow

---

## Current State

### What Already Exists ✅

1. **Type Definitions** (`/packages/types/src/workflow-primitives.ts`)
   ```typescript
   ConditionalStep {
     type: 'conditional'
     id: string
     name: string
     condition: ConditionGroup
     trueBranch: WorkflowStep[]
     falseBranch: WorkflowStep[]
   }
   ```

2. **Condition Evaluation Logic** (`/apps/web/src/lib/forms/conditional-evaluator.ts`)
   - 9 operators: equals, not_equals, contains, greater_than, less_than, in, not_in, regex, is_empty
   - AND/OR/NOT logic groups
   - Field value resolution
   - Type-safe evaluation

3. **Workflow Engine** (`/apps/web/src/lib/workflow/engine.ts`)
   - `evaluateConditionalBranch()` method exists
   - Context management for step execution
   - Step history tracking

4. **UI Pattern Reference** (`/apps/web/src/components/form-builder/conditional-rule-builder.tsx`)
   - Component for building condition rules
   - Field selector, operator selector, value input
   - AND/OR group logic
   - Can be adapted for workflow branching

### What Needs to be Built ❌

1. **Workflow Builder UI Components**
   - ConditionalStepEditor component
   - Visual branch path representation
   - Branch step management (add/remove/reorder)
   - Step type selector (form, conditional, iterator)

2. **Workflow Execution Enhancements**
   - Branch decision tracking in work order history
   - Conditional step status representation
   - Path visualization in work order UI

3. **Validation & Error Handling**
   - Cycle detection in branch paths
   - Required field validation in conditions
   - Dead-end path warnings

4. **Data Model Extensions**
   - Store branch decisions in WorkOrderStepHistory
   - Track which path was taken and why

---

## Goals & Objectives

### Primary Goals

1. **Enable conditional branching in workflows** based on form submission data
2. **Provide intuitive UI** for building and visualizing conditional logic
3. **Maintain type safety** and data integrity throughout the system
4. **Support complex decision trees** with nested conditions
5. **Preserve auditability** by tracking which branches were taken and why

### Non-Goals (Out of Scope)

- Time-based branching (scheduled steps)
- External API condition evaluation
- Machine learning-based decision making
- Real-time collaboration on workflow editing

---

## Technical Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. Workflow Definition (Design Time)                   │
│     ┌──────────────────────────────────────┐           │
│     │ ConditionalStep                      │           │
│     │  - condition: ConditionGroup         │           │
│     │  - trueBranch: WorkflowStep[]        │           │
│     │  - falseBranch: WorkflowStep[]       │           │
│     └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. Work Order Execution (Runtime)                      │
│     ┌──────────────────────────────────────┐           │
│     │ WorkflowEngine.executeStep()         │           │
│     │  → evaluateConditionalBranch()       │           │
│     │     → ConditionalEvaluator.evaluate()│           │
│     │        → resolveFieldValue()         │           │
│     │           ↓                           │           │
│     │        decision: true | false        │           │
│     └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. Branch Selection & Execution                        │
│     ┌──────────────────────────────────────┐           │
│     │ if (decision === true)               │           │
│     │   execute trueBranch steps           │           │
│     │ else                                 │           │
│     │   execute falseBranch steps          │           │
│     └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. Audit Trail                                         │
│     ┌──────────────────────────────────────┐           │
│     │ WorkOrderStepHistory                 │           │
│     │  - stepId                            │           │
│     │  - status: 'branched'                │           │
│     │  - metadata: {                       │           │
│     │      conditionResult: true,          │           │
│     │      branchTaken: 'trueBranch',      │           │
│     │      evaluationContext: {...}        │           │
│     │    }                                 │           │
│     └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```
WorkflowBuilder
  ├── StepList
  │   ├── FormStepCard
  │   ├── ConditionalStepCard ← NEW
  │   │   ├── ConditionSummary
  │   │   └── BranchPreview
  │   └── IteratorStepCard
  │
  ├── StepEditor (sidebar)
  │   ├── FormStepEditor
  │   ├── ConditionalStepEditor ← NEW
  │   │   ├── ConditionBuilder (reuse from form-builder)
  │   │   ├── BranchStepManager
  │   │   │   ├── TrueBranchEditor
  │   │   │   └── FalseBranchEditor
  │   │   └── ValidationWarnings
  │   └── IteratorStepEditor
  │
  └── StepTypeSelector ← ENHANCED
      ├── Form Step
      ├── Conditional Branch ← NEW
      └── Iterator Step
```

### Database Schema Changes

**WorkOrderStepHistory** - Add new fields:

```typescript
{
  // Existing fields
  id: string
  stepId: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'

  // NEW: For conditional steps
  branchDecision?: {
    conditionResult: boolean
    branchTaken: 'trueBranch' | 'falseBranch'
    evaluationTimestamp: Date
    evaluatedCondition: ConditionGroup
    fieldValuesUsed: Record<string, any>
  }
}
```

---

## Implementation Plan

### Phase 1: Core Conditional Step UI (Week 1-2)

#### 1.1 Step Type Selector Enhancement
**File:** `/apps/web/src/components/workflow-builder/step-type-selector.tsx`

- Add "Conditional Branch" option to step type menu
- Icon: branching diagram icon
- Description: "Route to different steps based on form data"

#### 1.2 Conditional Step Card Component
**File:** `/apps/web/src/components/workflow-builder/conditional-step-card.tsx`

```typescript
interface ConditionalStepCardProps {
  step: ConditionalStep
  onEdit: () => void
  onDelete: () => void
  isActive: boolean
}
```

**Features:**
- Display condition summary (e.g., "If Status equals 'Failed'")
- Show count of steps in each branch
- Visual branching indicator
- Edit/delete actions

#### 1.3 Condition Builder Integration
**File:** `/apps/web/src/components/workflow-builder/workflow-condition-builder.tsx`

**Strategy:** Adapt existing `ConditionalRuleBuilder` from form-builder

**Key differences:**
- Field selector must reference **previous steps' form fields**
- Show step name + field name (e.g., "Safety Inspection → Status")
- Support cross-step field references
- Validate that referenced fields exist in workflow

**Implementation:**
```typescript
function WorkflowConditionBuilder({
  condition,
  onChange,
  availableFields, // Fields from all previous steps
  currentStepIndex
}: Props) {
  // Reuse ConditionEvaluator logic
  // Enhanced field selector with step context
}
```

### Phase 2: Branch Management UI (Week 2-3)

#### 2.1 Branch Step Manager
**File:** `/apps/web/src/components/workflow-builder/branch-step-manager.tsx`

**Layout:**
```
┌────────────────────────────────────────────┐
│  True Branch (If condition matches)       │
│  ┌──────────────────────────────────────┐ │
│  │ + Add Step                           │ │
│  │  ├─ Form Step 1                      │ │
│  │  ├─ Form Step 2                      │ │
│  │  └─ ...                              │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  False Branch (Otherwise)                  │
│  ┌──────────────────────────────────────┐ │
│  │ + Add Step                           │ │
│  │  ├─ Form Step 1                      │ │
│  │  └─ ...                              │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop step reordering within branches
- Add/remove steps in each branch
- Visual nesting indicators
- Branch path preview

#### 2.2 Nested Step Editor
**File:** `/apps/web/src/components/workflow-builder/nested-step-list.tsx`

**Requirements:**
- Support recursive rendering (branches can contain conditional steps)
- Depth limit: 5 levels to prevent excessive nesting
- Breadcrumb navigation for nested editing
- Collapse/expand branch views

### Phase 3: Workflow Engine Enhancements (Week 3-4)

#### 3.1 Enhanced Branch Evaluation
**File:** `/apps/web/src/lib/workflow/engine.ts`

**Current implementation:**
```typescript
async evaluateConditionalBranch(
  step: ConditionalStep,
  context: WorkflowContext
): Promise<WorkflowStep[]> {
  // Basic implementation exists
}
```

**Enhancements needed:**
```typescript
async evaluateConditionalBranch(
  step: ConditionalStep,
  context: WorkflowContext
): Promise<{
  branchSteps: WorkflowStep[]
  decision: boolean
  evaluationDetails: {
    conditionResult: boolean
    branchTaken: 'trueBranch' | 'falseBranch'
    fieldValuesUsed: Record<string, any>
    evaluationTimestamp: Date
  }
}> {
  // 1. Resolve field values from context
  const fieldValues = this.resolveFieldValuesFromContext(context)

  // 2. Evaluate condition
  const result = ConditionalEvaluator.evaluate(
    step.condition,
    fieldValues
  )

  // 3. Select branch
  const branchSteps = result ? step.trueBranch : step.falseBranch

  // 4. Record decision for audit
  return {
    branchSteps,
    decision: result,
    evaluationDetails: {
      conditionResult: result,
      branchTaken: result ? 'trueBranch' : 'falseBranch',
      fieldValuesUsed,
      evaluationTimestamp: new Date()
    }
  }
}
```

#### 3.2 Field Value Resolution
**File:** `/apps/web/src/lib/workflow/field-resolver.ts` (NEW)

```typescript
class WorkflowFieldResolver {
  /**
   * Resolve field values from completed steps in work order
   */
  static resolveFieldValue(
    fieldPath: string, // Format: "stepId.fieldId"
    workOrder: WorkOrder
  ): any {
    const [stepId, fieldId] = fieldPath.split('.')

    // Find completed step
    const stepHistory = workOrder.stepHistory.find(
      h => h.stepId === stepId && h.status === 'completed'
    )

    if (!stepHistory?.formSubmission) {
      throw new Error(`Step ${stepId} not completed`)
    }

    // Extract field value from submission
    return stepHistory.formSubmission.data[fieldId]
  }

  /**
   * Build field values map for condition evaluation
   */
  static buildFieldValuesMap(
    workOrder: WorkOrder
  ): Record<string, any> {
    const fieldValues: Record<string, any> = {}

    for (const history of workOrder.stepHistory) {
      if (history.status === 'completed' && history.formSubmission) {
        for (const [fieldId, value] of Object.entries(history.formSubmission.data)) {
          // Use qualified path: stepId.fieldId
          fieldValues[`${history.stepId}.${fieldId}`] = value
        }
      }
    }

    return fieldValues
  }
}
```

#### 3.3 Branch Decision Tracking
**File:** `/apps/web/src/lib/workflow/engine.ts`

```typescript
async recordBranchDecision(
  workOrder: WorkOrder,
  step: ConditionalStep,
  evaluationDetails: BranchEvaluationDetails
) {
  await prisma.workOrderStepHistory.create({
    data: {
      workOrderId: workOrder.id,
      stepId: step.id,
      status: 'completed', // Conditional step completes immediately
      metadata: {
        type: 'conditional_branch',
        ...evaluationDetails
      },
      completedAt: new Date()
    }
  })
}
```

### Phase 4: Validation & Error Handling (Week 4)

#### 4.1 Workflow Validation Rules
**File:** `/apps/web/src/lib/workflow/validator.ts` (NEW)

```typescript
class WorkflowValidator {
  /**
   * Validate entire workflow for issues
   */
  static validate(workflow: Workflow): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check for cycles
    if (this.hasCycles(workflow.steps)) {
      errors.push({
        type: 'CYCLE_DETECTED',
        message: 'Workflow contains circular references'
      })
    }

    // Check for dead ends
    const deadEnds = this.findDeadEnds(workflow.steps)
    if (deadEnds.length > 0) {
      warnings.push({
        type: 'DEAD_END_PATHS',
        message: `${deadEnds.length} branch paths lead to no steps`,
        paths: deadEnds
      })
    }

    // Check field references
    const invalidRefs = this.validateFieldReferences(workflow.steps)
    if (invalidRefs.length > 0) {
      errors.push({
        type: 'INVALID_FIELD_REFERENCE',
        message: 'Conditions reference non-existent fields',
        references: invalidRefs
      })
    }

    return { errors, warnings, isValid: errors.length === 0 }
  }

  /**
   * Detect cycles in workflow graph
   */
  private static hasCycles(steps: WorkflowStep[]): boolean {
    // Depth-first search to detect cycles
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function dfs(step: WorkflowStep): boolean {
      if (recursionStack.has(step.id)) return true // Cycle found
      if (visited.has(step.id)) return false

      visited.add(step.id)
      recursionStack.add(step.id)

      if (step.type === 'conditional') {
        for (const branchStep of [...step.trueBranch, ...step.falseBranch]) {
          if (dfs(branchStep)) return true
        }
      }

      recursionStack.delete(step.id)
      return false
    }

    return steps.some(step => dfs(step))
  }

  /**
   * Find branch paths that lead nowhere
   */
  private static findDeadEnds(steps: WorkflowStep[]): string[] {
    const deadEnds: string[] = []

    function checkBranch(branch: WorkflowStep[], path: string) {
      if (branch.length === 0) {
        deadEnds.push(path)
        return
      }

      for (const step of branch) {
        if (step.type === 'conditional') {
          checkBranch(step.trueBranch, `${path} → ${step.name} (true)`)
          checkBranch(step.falseBranch, `${path} → ${step.name} (false)`)
        }
      }
    }

    for (const step of steps) {
      if (step.type === 'conditional') {
        checkBranch(step.trueBranch, `${step.name} (true)`)
        checkBranch(step.falseBranch, `${step.name} (false)`)
      }
    }

    return deadEnds
  }

  /**
   * Validate field references in conditions
   */
  private static validateFieldReferences(steps: WorkflowStep[]): InvalidReference[] {
    const invalid: InvalidReference[] = []
    const availableFields = new Set<string>()

    for (const step of steps) {
      if (step.type === 'conditional') {
        // Check if condition references valid fields
        const refs = this.extractFieldReferences(step.condition)

        for (const ref of refs) {
          if (!availableFields.has(ref)) {
            invalid.push({
              stepId: step.id,
              stepName: step.name,
              fieldReference: ref,
              message: `Field "${ref}" not available at this step`
            })
          }
        }

        // Recursively check branches
        this.validateFieldReferences(step.trueBranch)
        this.validateFieldReferences(step.falseBranch)
      }

      if (step.type === 'form') {
        // Add this step's fields to available set
        for (const field of step.form.fields) {
          availableFields.add(`${step.id}.${field.id}`)
        }
      }
    }

    return invalid
  }
}
```

#### 4.2 Runtime Error Handling

```typescript
// In WorkflowEngine.executeStep()
try {
  if (step.type === 'conditional') {
    const evaluation = await this.evaluateConditionalBranch(step, context)

    // Record decision
    await this.recordBranchDecision(workOrder, step, evaluation.evaluationDetails)

    // Execute selected branch
    for (const branchStep of evaluation.branchSteps) {
      await this.executeStep(branchStep, context)
    }
  }
} catch (error) {
  if (error instanceof FieldNotFoundError) {
    // Field referenced in condition doesn't exist
    await this.recordStepError(workOrder, step, {
      type: 'FIELD_NOT_FOUND',
      message: error.message,
      canRetry: false
    })
  } else if (error instanceof EvaluationError) {
    // Condition evaluation failed
    await this.recordStepError(workOrder, step, {
      type: 'EVALUATION_FAILED',
      message: error.message,
      canRetry: true
    })
  }

  throw error
}
```

### Phase 5: Work Order UI Updates (Week 5)

#### 5.1 Conditional Step Display
**File:** `/apps/web/src/components/work-orders/work-order-step-card.tsx`

**For operators viewing work orders:**
```
┌──────────────────────────────────────────────┐
│ ⚡ Conditional: Route by Inspection Result   │
│                                              │
│ ✓ Condition Evaluated                        │
│   Result: FAILED (value: "Urgent Repair")   │
│   Branch Taken: True Branch                  │
│   → Escalated to Urgent Repair Form          │
│                                              │
│ Evaluated: 2025-11-12 14:35:22              │
└──────────────────────────────────────────────┘
```

#### 5.2 Branch Path Visualization
**File:** `/apps/web/src/components/work-orders/workflow-path-viz.tsx`

**Show visual path taken:**
```
1. Safety Inspection Form ✓
    ↓
2. Route by Result ⚡
    ├─ [TRUE] Urgent Repair Required ← TAKEN
    │   ├─ Emergency Repair Form ✓
    │   └─ Manager Approval (in progress...)
    │
    └─ [FALSE] Standard Maintenance
        └─ (not executed)
```

---

## User Experience

### Workflow Builder Flow

1. **Add Conditional Step**
   - Click "Add Step" in workflow builder
   - Select "Conditional Branch" from step types
   - Step is added to workflow

2. **Configure Condition**
   - Click on conditional step to open editor
   - Build condition using familiar UI (similar to form field conditions)
   - Select fields from previous steps
   - Choose operator and enter value
   - Add multiple conditions with AND/OR logic

3. **Define Branches**
   - Add steps to "True Branch"
   - Add steps to "False Branch"
   - Each branch can contain any step type (including nested conditionals)
   - Preview shows branch paths

4. **Validate & Save**
   - Automatic validation checks for issues
   - Warnings shown for dead ends or unused branches
   - Errors block saving (invalid field references, cycles)
   - Save workflow

### Operator Experience (Work Order Execution)

1. **Linear Steps**
   - Operators see and complete steps normally
   - Conditional steps are invisible - they execute automatically

2. **Automatic Branching**
   - After completing a form, workflow engine evaluates conditions
   - Correct branch is chosen automatically
   - Next step(s) appear based on branch decision

3. **Transparency**
   - Work order history shows which branch was taken
   - Audit trail includes condition evaluation details
   - Operators can see "why" a certain path was chosen

---

## Testing Strategy

### Unit Tests

#### Condition Evaluation
```typescript
// conditional-evaluator.test.ts
describe('ConditionalEvaluator', () => {
  it('should evaluate simple equals condition', () => {
    const condition = {
      type: 'condition',
      field: 'status',
      operator: 'equals',
      value: 'failed'
    }
    const values = { status: 'failed' }

    expect(ConditionalEvaluator.evaluate(condition, values)).toBe(true)
  })

  it('should evaluate AND group', () => {
    const condition = {
      type: 'group',
      operator: 'and',
      conditions: [
        { type: 'condition', field: 'status', operator: 'equals', value: 'failed' },
        { type: 'condition', field: 'priority', operator: 'equals', value: 'high' }
      ]
    }

    const values = { status: 'failed', priority: 'high' }
    expect(ConditionalEvaluator.evaluate(condition, values)).toBe(true)
  })

  // ... more test cases
})
```

#### Workflow Validation
```typescript
// workflow-validator.test.ts
describe('WorkflowValidator', () => {
  it('should detect cycles', () => {
    const workflow = createWorkflowWithCycle()
    const result = WorkflowValidator.validate(workflow)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'CYCLE_DETECTED' })
    )
  })

  it('should detect invalid field references', () => {
    const workflow = createWorkflowWithInvalidRefs()
    const result = WorkflowValidator.validate(workflow)

    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'INVALID_FIELD_REFERENCE' })
    )
  })
})
```

#### Field Resolution
```typescript
// field-resolver.test.ts
describe('WorkflowFieldResolver', () => {
  it('should resolve field from completed step', () => {
    const workOrder = createWorkOrderWithCompletedSteps()
    const value = WorkflowFieldResolver.resolveFieldValue(
      'step-1.status',
      workOrder
    )

    expect(value).toBe('failed')
  })

  it('should throw error for incomplete step', () => {
    const workOrder = createWorkOrderWithPendingStep()

    expect(() => {
      WorkflowFieldResolver.resolveFieldValue('step-2.status', workOrder)
    }).toThrow('Step step-2 not completed')
  })
})
```

### Integration Tests

```typescript
// workflow-engine-conditional.test.ts
describe('WorkflowEngine - Conditional Steps', () => {
  it('should execute true branch when condition matches', async () => {
    const workflow = createConditionalWorkflow()
    const workOrder = await createWorkOrder(workflow)

    // Complete first step with data that triggers true branch
    await completeStep(workOrder, 'step-1', { status: 'failed' })

    // Execute conditional step
    const nextStep = await engine.getNextStep(workOrder)

    expect(nextStep.id).toBe('true-branch-step-1')
  })

  it('should record branch decision in history', async () => {
    // ... test implementation
  })

  it('should handle nested conditionals', async () => {
    // ... test implementation
  })
})
```

### E2E Tests

```typescript
// workflow-builder-conditional.e2e.ts
describe('Conditional Branching E2E', () => {
  it('should create workflow with conditional step', () => {
    // Navigate to workflow builder
    cy.visit('/workflows/new')

    // Add form step
    cy.contains('Add Step').click()
    cy.contains('Form Step').click()
    // ... configure form

    // Add conditional step
    cy.contains('Add Step').click()
    cy.contains('Conditional Branch').click()

    // Configure condition
    cy.contains('Add Condition').click()
    cy.get('[data-testid=field-selector]').select('step-1.status')
    cy.get('[data-testid=operator-selector]').select('equals')
    cy.get('[data-testid=value-input]').type('failed')

    // Add steps to branches
    cy.contains('True Branch').click()
    cy.contains('Add Step').click()
    // ... add step to true branch

    // Save workflow
    cy.contains('Save Workflow').click()
    cy.contains('Workflow saved successfully')
  })

  it('should execute workflow with branching', () => {
    // ... test work order execution
  })
})
```

---

## Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Infinite loops** from circular references | HIGH | MEDIUM | Implement cycle detection in validator; depth limit on execution |
| **Performance degradation** with deeply nested branches | MEDIUM | LOW | Set nesting depth limit (5 levels); optimize evaluation logic |
| **Field resolution failures** at runtime | HIGH | MEDIUM | Comprehensive validation at design time; graceful error handling |
| **Complex UI** overwhelming users | MEDIUM | HIGH | Progressive disclosure; templates; visual feedback |
| **Data migration** for existing workflows | LOW | MEDIUM | New feature is additive; existing workflows unaffected |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users create overly complex workflows | MEDIUM | Provide templates; warn at 3+ nesting levels |
| Confusion about which branch executes | HIGH | Clear labeling; path visualization in work order |
| Difficult to debug failed conditions | HIGH | Detailed evaluation logs; test mode for workflows |
| Hard to understand field references | MEDIUM | Autocomplete with previews; inline field value display |

### Mitigation Strategies

1. **Validation Layer**
   - Run validation on every workflow save
   - Block saving invalid workflows
   - Show clear error messages with fix suggestions

2. **Testing Infrastructure**
   - Workflow "test mode" to simulate execution
   - Preview branch paths with sample data
   - Highlight which path would be taken

3. **Documentation & Templates**
   - Create common workflow templates (inspection routing, escalation, etc.)
   - Inline help text and tooltips
   - Video tutorials for complex scenarios

4. **Gradual Rollout**
   - Feature flag for conditional steps
   - Beta testing with power users
   - Gather feedback before general release

---

## Success Metrics

### Adoption Metrics

- **Usage Rate:** % of new workflows using conditional steps (target: 30% within 3 months)
- **Complexity:** Average branches per conditional workflow (target: 2-3)
- **Template Usage:** % of conditional workflows created from templates (target: 50%)

### Quality Metrics

- **Error Rate:** % of work orders failing due to branch evaluation errors (target: <0.1%)
- **Validation Catches:** % of invalid workflows caught before save (target: 100%)
- **Support Tickets:** Conditional branching-related tickets (target: <5/month)

### Performance Metrics

- **Evaluation Time:** Average time to evaluate condition (target: <100ms)
- **Workflow Load Time:** Time to load workflow with conditionals in builder (target: <2s)
- **Work Order Execution:** Time overhead for conditional steps (target: <200ms)

### User Satisfaction

- **NPS Score:** For conditional branching feature (target: >40)
- **Feature Usage:** Return rate for users who try feature (target: >70%)
- **Workflow Completion:** Success rate of work orders with conditionals (target: >95%)

---

## Timeline & Milestones

### Week 1-2: Core UI Foundation
- ✅ Conditional step card component
- ✅ Step type selector enhancement
- ✅ Basic condition builder integration
- **Milestone:** Can add conditional step to workflow

### Week 3-4: Branch Management
- ✅ Branch step manager UI
- ✅ Nested step list rendering
- ✅ Drag-and-drop support
- **Milestone:** Can configure complete conditional workflow

### Week 4-5: Engine & Validation
- ✅ Enhanced branch evaluation logic
- ✅ Field value resolution
- ✅ Workflow validation system
- ✅ Error handling
- **Milestone:** Can execute workflow with branching

### Week 5-6: Work Order UI & Testing
- ✅ Conditional step display in work orders
- ✅ Branch path visualization
- ✅ Unit and integration tests
- ✅ E2E test coverage
- **Milestone:** Feature complete and tested

### Week 7: Polish & Documentation
- ✅ Workflow templates with branching
- ✅ User documentation
- ✅ Admin training materials
- ✅ Performance optimization
- **Milestone:** Ready for beta release

### Week 8: Beta & Feedback
- ✅ Beta release to selected users
- ✅ Gather feedback
- ✅ Fix critical issues
- ✅ Iteration based on usage patterns
- **Milestone:** Ready for general availability

---

## Future Enhancements (Post-V1)

### Multi-way Branching
Instead of just true/false, support switch-like branching:
```typescript
SwitchStep {
  field: string
  cases: {
    value: any
    steps: WorkflowStep[]
  }[]
  default: WorkflowStep[]
}
```

### Expression-based Conditions
Support complex expressions:
```
(priority == "high" AND status == "failed") OR assignee == current_user
```

### Workflow Templates Library
- Pre-built workflows for common scenarios
- Industry-specific templates
- Community-shared workflows

### Visual Workflow Diagram
- Flow chart view of entire workflow
- See all possible paths
- Click to edit steps

### Conditional Assignments
- Assign work order to different teams based on conditions
- SLA variation by branch

### A/B Testing Workflows
- Random branch selection for testing
- Analytics on branch performance

---

## Appendix

### Key Files Reference

| File Path | Purpose |
|-----------|---------|
| `/packages/types/src/workflow-primitives.ts` | ConditionalStep type definition |
| `/apps/web/src/lib/workflow/engine.ts` | Workflow execution engine |
| `/apps/web/src/lib/forms/conditional-evaluator.ts` | Condition evaluation logic |
| `/apps/web/src/components/form-builder/conditional-rule-builder.tsx` | UI pattern for conditions |
| `/apps/web/src/components/workflow-builder/` | Workflow builder components |

### Glossary

- **Conditional Step:** A workflow step that routes execution to different paths based on form data
- **Branch:** A path of steps that executes when a condition is true or false
- **Condition Group:** A set of conditions combined with AND/OR logic
- **Field Reference:** A pointer to a field in a previous step's form (format: `stepId.fieldId`)
- **Evaluation Context:** The data available when evaluating a condition (completed form submissions)
- **Dead End:** A branch path with no steps (may be valid in some cases)
- **Cycle:** A circular reference in workflow steps (always invalid)

### References

- [Workflow Primitives Type Definitions](../packages/types/src/workflow-primitives.ts)
- [Conditional Evaluator Implementation](../apps/web/src/lib/forms/conditional-evaluator.ts)
- [Workflow Engine](../apps/web/src/lib/workflow/engine.ts)
- [Form Builder Conditional UI](../apps/web/src/components/form-builder/conditional-rule-builder.tsx)

---

**Document Owner:** Development Team
**Last Updated:** 2025-11-12
**Next Review:** After Phase 1 completion
