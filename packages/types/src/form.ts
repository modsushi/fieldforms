import { z } from 'zod';
import { geoPointSchema } from './entity';

// Conditional Rule
export const conditionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    field: z.string(),
    operator: z.enum([
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'greater_than',
      'less_than',
      'in',
      'not_in',
      'regex',
    ]),
    value: z.any(),
  })
);

export const conditionalRuleSchema = z.object({
  type: z.enum(['expression', 'rule']),
  value: z.union([
    z.string(),
    z.object({
      conditions: z.object({
        all: z.array(conditionSchema).optional(),
        any: z.array(conditionSchema).optional(),
        not: conditionSchema.optional(),
      }),
    }),
  ]),
});

export type ConditionalRule = z.infer<typeof conditionalRuleSchema>;
export type Condition = z.infer<typeof conditionSchema>;

// Validation Rule
export const validationRuleSchema = z.object({
  type: z.enum(['min', 'max', 'min_length', 'max_length', 'pattern', 'custom']),
  value: z.any(),
  message: z.string().optional(),
});

export type ValidationRule = z.infer<typeof validationRuleSchema>;

// Form Field
export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'number',
    'select',
    'multiselect',
    'date',
    'datetime',
    'checkbox',
    'radio',
    'textarea',
    'signature',
    'photo',
    'file',
    'location',
    'entity_selector',
    'entity_creator',
    'form_selector',
    'barcode',
    'qrcode',
  ]),
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.union([z.boolean(), conditionalRuleSchema]).optional(),
  validation: z.array(validationRuleSchema).optional(),
  visible: conditionalRuleSchema.optional(),
  disabled: conditionalRuleSchema.optional(),
  options: z
    .object({
      source: z.enum(['static', 'entity', 'api', 'previous_submission']),
      value: z.any(),
    })
    .optional(),
  defaultValue: z
    .object({
      source: z.enum(['static', 'context', 'entity_property', 'calculation']),
      value: z.any(),
    })
    .optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

// Form Section
export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
  visible: conditionalRuleSchema.optional(),
  repeatable: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      addButtonText: z.string().optional(),
    })
    .optional(),
});

export type FormSection = z.infer<typeof formSectionSchema>;

// Form Template
export const formTemplateSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  version: z.number().default(1),
  parentTemplateId: z.string().uuid().optional(),
  sections: z.array(formSectionSchema),
  dynamicFields: z
    .object({
      source: z.enum(['entity', 'workflow_context', 'api']),
      mapping: z.record(z.string()),
    })
    .optional(),
  computedFields: z
    .array(
      z.object({
        fieldId: z.string(),
        expression: z.string(),
        dependencies: z.array(z.string()),
      })
    )
    .optional(),
  variables: z
    .array(
      z.object({
        name: z.string(),
        source: z.enum(['context', 'entity', 'user', 'environment']),
        path: z.string(),
      })
    )
    .optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FormTemplate = z.infer<typeof formTemplateSchema>;

// Attachment
export const attachmentSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  localPath: z.string().optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

// Form Submission
export const formSubmissionSchema = z.object({
  id: z.string().uuid(),
  formTemplateId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  workflowStepId: z.string().uuid().optional(),
  data: z.record(z.any()),
  computedData: z.record(z.any()).optional(),
  validationStatus: z.record(z.any()).default({}),
  attachments: z.array(attachmentSchema).default([]),
  location: geoPointSchema.optional(),
  deviceInfo: z.record(z.any()).optional(),
  offlineUuid: z.string().optional(),
  version: z.number().default(1),
  submittedBy: z.string().uuid(),
  submittedAt: z.date(),
  syncedAt: z.date().optional(),
});

export type FormSubmission = z.infer<typeof formSubmissionSchema>;

