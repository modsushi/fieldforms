import { GeoJSON } from 'geojson';

/**
 * Base interface for all workflow steps
 */
export interface WorkflowStepBase {
  id: string;
  name: string;
  description?: string;
}

/**
 * Form Step - Fill a single form
 * Use case: Complete a form, optionally linked to an entity
 */
export interface FormStep extends WorkflowStepBase {
  type: 'form';
  config: {
    formTemplateId: string;
    entityId?: string; // Optional linked entity (site, asset, etc.)
    allowMultiple?: boolean; // Allow multiple submissions
    minimumSubmissions?: number; // Minimum required submissions
  };
}

/**
 * Conditional Step - Branch based on field value
 * Use case: Different workflows based on form responses
 * Example: "Corrective Type" - Choose different forms based on issue type
 */
export interface ConditionalStep extends WorkflowStepBase {
  type: 'conditional';
  config: {
    sourceStepId: string; // Previous step to evaluate
    fieldId: string; // Field to check from source step
    branches: {
      condition: {
        operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
        value: any;
      };
      nextSteps: WorkflowStep[]; // Nested steps for this branch
    }[];
    defaultBranch?: WorkflowStep[]; // Fallback if no conditions match
  };
}

/**
 * Iterator Step - Repeat steps for each item
 * Use case: Perform same workflow for multiple sites/assets
 * Example: "Inspective Type" - Fill same form for each selected site
 */
export interface IteratorStep extends WorkflowStepBase {
  type: 'iterator';
  config: {
    sourceType: 'entities' | 'manual_list' | 'field_value' | 'query';
    
    // For entities source
    entityType?: string; // e.g., "site", "equipment"
    entityIds?: string[]; // Pre-selected entities
    entityQuery?: {
      // Dynamic entity selection
      filters?: Record<string, any>;
      tags?: string[];
    };
    
    // For field_value source (dynamic from previous form)
    fieldSource?: {
      stepId: string;
      fieldId: string;
    };
    
    // For manual_list source
    items?: Array<{ id: string; label: string; metadata?: Record<string, any> }>;
    
    // Steps to repeat per item
    steps: WorkflowStep[];
    
    // Iteration settings
    allowSkip?: boolean; // Allow skipping items
    requireAll?: boolean; // Require all items to be completed
  };
}

/**
 * Location Marker Step - Drop pins and form per pin
 * Use case: Field surveys, defect marking
 * Example: "Survey Type" - Drop markers at locations and fill form per marker
 */
export interface LocationMarkerStep extends WorkflowStepBase {
  type: 'location-marker';
  config: {
    minMarkers?: number; // Minimum markers required
    maxMarkers?: number; // Maximum markers allowed
    formTemplateId: string; // Form to fill per marker
    
    // Map configuration
    mapCenter?: { lat: number; lng: number };
    mapZoom?: number;
    allowedArea?: GeoJSON; // Optional boundary (e.g., site boundaries)
    
    // Marker settings
    markerType?: string; // Category of markers (e.g., "defect", "observation")
    allowPhotos?: boolean; // Attach photos to markers
    requireDescription?: boolean; // Require text description per marker
  };
}

/**
 * Union type of all workflow step types
 */
export type WorkflowStep = FormStep | ConditionalStep | IteratorStep | LocationMarkerStep;

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  version: string; // Schema version for future compatibility
  steps: WorkflowStep[];
  metadata?: {
    estimatedDuration?: number; // Minutes
    requiredCapabilities?: string[]; // e.g., ["camera", "gps"]
    tags?: string[];
  };
}

/**
 * Workflow execution context
 * Contains data accumulated during workflow execution
 */
export interface WorkflowExecutionContext {
  workOrderId: string;
  workflowId: string;
  startedAt: Date;
  startedBy: string;
  
  // Accumulated data from completed steps
  stepData: Record<string, any>; // stepId -> step output data
  
  // Current state
  currentStepIndex: number;
  currentIterationContext?: {
    iteratorStepId: string;
    currentItemIndex: number;
    totalItems: number;
    currentItem: any;
  };
  
  // Metadata
  variables: Record<string, any>; // Workflow-level variables
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  stepId: string;
  status: 'completed' | 'skipped' | 'failed';
  data: any;
  timestamp: Date;
  error?: string;
}

/**
 * Workflow evaluation helpers
 */
export interface WorkflowEvaluator {
  /**
   * Evaluate a conditional expression
   */
  evaluateCondition(
    condition: ConditionalStep['config']['branches'][0]['condition'],
    value: any
  ): boolean;
  
  /**
   * Get next step(s) to execute
   */
  getNextSteps(
    currentStep: WorkflowStep,
    context: WorkflowExecutionContext
  ): WorkflowStep[] | null;
  
  /**
   * Check if workflow is complete
   */
  isWorkflowComplete(
    definition: WorkflowDefinition,
    context: WorkflowExecutionContext
  ): boolean;
  
  /**
   * Calculate workflow progress
   */
  calculateProgress(
    definition: WorkflowDefinition,
    context: WorkflowExecutionContext
  ): {
    totalSteps: number;
    completedSteps: number;
    percentage: number;
  };
}

/**
 * Type guards
 */
export function isFormStep(step: WorkflowStep): step is FormStep {
  return step.type === 'form';
}

export function isConditionalStep(step: WorkflowStep): step is ConditionalStep {
  return step.type === 'conditional';
}

export function isIteratorStep(step: WorkflowStep): step is IteratorStep {
  return step.type === 'iterator';
}

export function isLocationMarkerStep(step: WorkflowStep): step is LocationMarkerStep {
  return step.type === 'location-marker';
}

