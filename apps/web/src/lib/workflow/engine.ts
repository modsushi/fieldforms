import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecutionContext,
  StepExecutionResult,
  FormStep,
  ConditionalStep,
  IteratorStep,
  LocationMarkerStep,
  isFormStep,
  isConditionalStep,
  isIteratorStep,
  isLocationMarkerStep,
} from '@fieldform/types';
import { db } from '@fieldform/database';

/**
 * Workflow Execution Engine
 * Handles step progression, branching, iteration, and state management
 */
export class WorkflowEngine {
  /**
   * Initialize a new workflow execution
   */
  async initializeExecution(
    workOrderId: string,
    workflowId: string,
    userId: string
  ): Promise<WorkflowExecutionContext> {
    const context: WorkflowExecutionContext = {
      workOrderId,
      workflowId,
      startedAt: new Date(),
      startedBy: userId,
      stepData: {},
      currentStepIndex: 0,
      variables: {},
    };

    return context;
  }

  /**
   * Get the current active step for a work order
   */
  async getCurrentStep(workOrderId: string): Promise<WorkflowStep | null> {
    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      include: { workflow: true },
    });

    if (!workOrder) return null;

    const definition = workOrder.workflow.definition as WorkflowDefinition;
    if (!definition || !definition.steps) return null;

    const currentStep = definition.steps[workOrder.currentStepIndex];
    return currentStep || null;
  }

  /**
   * Execute a workflow step
   */
  async executeStep(
    workOrderId: string,
    stepIndex: number,
    stepData: any
  ): Promise<StepExecutionResult> {
    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      include: { workflow: true, steps: true },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const definition = workOrder.workflow.definition as WorkflowDefinition;
    const step = definition.steps[stepIndex];

    if (!step) {
      throw new Error('Step not found');
    }

    try {
      // Create or update work order step record
      await db.workOrderStep.upsert({
        where: {
          workOrderId_stepIndex: {
            workOrderId,
            stepIndex,
          },
        },
        create: {
          workOrderId,
          stepIndex,
          stepDefinitionId: step.id,
          status: 'COMPLETED',
          data: stepData,
          completedAt: new Date(),
        },
        update: {
          status: 'COMPLETED',
          data: stepData,
          completedAt: new Date(),
        },
      });

      return {
        stepId: step.id,
        status: 'completed',
        data: stepData,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'failed',
        data: null,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete a step and advance to the next
   */
  async completeStep(
    workOrderId: string,
    stepIndex: number,
    stepData: any
  ): Promise<{ nextStep: WorkflowStep | null; isComplete: boolean }> {
    // Execute the step
    const result = await this.executeStep(workOrderId, stepIndex, stepData);

    if (result.status === 'failed') {
      throw new Error(`Step execution failed: ${result.error}`);
    }

    // Get next step
    const nextStepInfo = await this.getNextStep(workOrderId);

    // Update work order with new current step index
    if (nextStepInfo.nextStep) {
      await db.workOrder.update({
        where: { id: workOrderId },
        data: { currentStepIndex: nextStepInfo.nextStepIndex },
      });
    } else if (nextStepInfo.isComplete) {
      // Mark work order as completed
      await db.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    return {
      nextStep: nextStepInfo.nextStep,
      isComplete: nextStepInfo.isComplete,
    };
  }

  /**
   * Get the next step to execute
   */
  async getNextStep(workOrderId: string): Promise<{
    nextStep: WorkflowStep | null;
    nextStepIndex: number;
    isComplete: boolean;
  }> {
    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      include: { workflow: true, steps: true },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const definition = workOrder.workflow.definition as WorkflowDefinition;
    const nextStepIndex = workOrder.currentStepIndex + 1;

    // Check if there are more steps
    if (nextStepIndex < definition.steps.length) {
      return {
        nextStep: definition.steps[nextStepIndex],
        nextStepIndex,
        isComplete: false,
      };
    }

    // No more steps - workflow is complete
    return {
      nextStep: null,
      nextStepIndex: -1,
      isComplete: true,
    };
  }

  /**
   * Evaluate conditional branch
   */
  async evaluateConditionalBranch(
    step: ConditionalStep,
    context: WorkflowExecutionContext
  ): Promise<WorkflowStep[]> {
    const sourceStepData = context.stepData[step.config.sourceStepId];

    if (!sourceStepData) {
      // No data from source step, use default branch
      return step.config.defaultBranch || [];
    }

    const fieldValue = sourceStepData[step.config.fieldId];

    // Evaluate each branch condition
    for (const branch of step.config.branches) {
      if (this.evaluateCondition(branch.condition, fieldValue)) {
        return branch.nextSteps;
      }
    }

    // No matching branch, use default
    return step.config.defaultBranch || [];
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(
    condition: ConditionalStep['config']['branches'][0]['condition'],
    value: any
  ): boolean {
    const { operator, value: conditionValue } = condition;

    switch (operator) {
      case 'equals':
        // Handle boolean comparison with type coercion
        if (typeof value === 'boolean' || typeof conditionValue === 'boolean') {
          return Boolean(value) === Boolean(conditionValue);
        }
        // Loose equality for other types
        return value == conditionValue;
      
      case 'contains':
        return String(value).includes(String(conditionValue));
      
      case 'greater_than':
        return Number(value) > Number(conditionValue);
      
      case 'less_than':
        return Number(value) < Number(conditionValue);
      
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(value);
      
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(value);
      
      default:
        return false;
    }
  }

  /**
   * Expand iterator step items
   */
  async expandIteratorSteps(
    step: IteratorStep,
    context: WorkflowExecutionContext
  ): Promise<Array<{ item: any; steps: WorkflowStep[] }>> {
    let items: any[] = [];

    switch (step.config.sourceType) {
      case 'entities':
        items = await this.getEntitiesForIterator(step);
        break;
      
      case 'manual_list':
        items = step.config.items || [];
        break;
      
      case 'field_value':
        if (step.config.fieldSource) {
          const sourceData = context.stepData[step.config.fieldSource.stepId];
          const fieldValue = sourceData?.[step.config.fieldSource.fieldId];
          items = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
        }
        break;
    }

    return items.map((item) => ({
      item,
      steps: step.config.steps,
    }));
  }

  /**
   * Get entities for iterator step
   */
  private async getEntitiesForIterator(step: IteratorStep): Promise<any[]> {
    const where: any = {};

    if (step.config.entityType) {
      where.entityType = step.config.entityType;
    }

    if (step.config.entityIds && step.config.entityIds.length > 0) {
      where.id = { in: step.config.entityIds };
    }

    if (step.config.entityQuery?.tags) {
      where.tags = { hasSome: step.config.entityQuery.tags };
    }

    const entities = await db.entity.findMany({ where });
    return entities;
  }

  /**
   * Get work order progress
   */
  async getWorkOrderProgress(workOrderId: string): Promise<{
    totalSteps: number;
    completedSteps: number;
    currentStepIndex: number;
    percentage: number;
    currentStep: WorkflowStep | null;
  }> {
    const workOrder = await db.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        workflow: true,
        steps: { where: { status: 'COMPLETED' } },
      },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const definition = workOrder.workflow.definition as WorkflowDefinition;
    const totalSteps = definition.steps.length;
    const completedSteps = workOrder.steps.length;
    const currentStep = definition.steps[workOrder.currentStepIndex] || null;

    return {
      totalSteps,
      completedSteps,
      currentStepIndex: workOrder.currentStepIndex,
      percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      currentStep,
    };
  }

  /**
   * Check if workflow is complete
   */
  async isWorkflowComplete(workOrderId: string): Promise<boolean> {
    const progress = await this.getWorkOrderProgress(workOrderId);
    return progress.completedSteps >= progress.totalSteps;
  }

  /**
   * Skip a step (if allowed)
   */
  async skipStep(
    workOrderId: string,
    stepIndex: number,
    reason?: string
  ): Promise<void> {
    await db.workOrderStep.upsert({
      where: {
        workOrderId_stepIndex: {
          workOrderId,
          stepIndex,
        },
      },
      create: {
        workOrderId,
        stepIndex,
        stepDefinitionId: 'skipped',
        status: 'SKIPPED',
        data: { reason },
      },
      update: {
        status: 'SKIPPED',
        data: { reason },
      },
    });
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();

