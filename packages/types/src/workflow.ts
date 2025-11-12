import { z } from 'zod';

// Workflow Trigger
export const workflowTriggerSchema = z.object({
  type: z.enum([
    'manual',
    'scheduled',
    'entity_selection',
    'location_based',
    'form_submission',
    'webhook',
    'qr_scan',
  ]),
  config: z.record(z.any()),
});

export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;

// Workflow Step
export const workflowStepSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum([
      'form',
      'entity_iterator',
      'location_capture',
      'decision',
      'spawn_workflow',
      'data_transform',
      'notification',
      'api_call',
    ]),
    config: z.record(z.any()),
    onComplete: z.array(workflowStepSchema).optional(),
    onError: z.array(workflowStepSchema).optional(),
  })
);

export type WorkflowStep = z.infer<typeof workflowStepSchema>;

// Workflow
export const workflowSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  trigger: workflowTriggerSchema,
  steps: z.array(workflowStepSchema),
  contextSchema: z.record(z.any()).optional(),
  completionRules: z.array(z.any()).optional(),
  scheduling: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
});

export type Workflow = z.infer<typeof workflowSchema>;

// Workflow Instance
export const workflowInstanceSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  orgId: z.string().uuid(),
  parentInstanceId: z.string().uuid().optional(),
  triggerData: z.record(z.any()).default({}),
  context: z.record(z.any()).default({}),
  currentStep: z.number().default(0),
  status: z.enum(['pending', 'active', 'paused', 'completed', 'cancelled']).default('pending'),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  startedBy: z.string().uuid(),
});

export type WorkflowInstance = z.infer<typeof workflowInstanceSchema>;

// Workflow Step Instance
export const workflowStepInstanceSchema = z.object({
  id: z.string().uuid(),
  workflowInstanceId: z.string().uuid(),
  stepIndex: z.number(),
  stepType: z.string(),
  stepConfig: z.record(z.any()),
  assignedTo: z.array(z.string().uuid()).optional(),
  assignedEntities: z.array(z.string().uuid()).optional(),
  status: z.enum(['pending', 'active', 'completed', 'failed']).default('pending'),
  inputData: z.record(z.any()).default({}),
  outputData: z.record(z.any()).default({}),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  completedBy: z.string().uuid().optional(),
});

export type WorkflowStepInstance = z.infer<typeof workflowStepInstanceSchema>;

// Collection
export const collectionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  collectionType: z.string(),
  name: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  entityIds: z.array(z.string().uuid()).default([]),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  createdBy: z.string().uuid(),
});

export type Collection = z.infer<typeof collectionSchema>;

