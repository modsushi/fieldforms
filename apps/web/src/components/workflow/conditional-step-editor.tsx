'use client';

import { useState, useEffect } from 'react';
import { Button, Label } from '@fieldform/ui';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ConditionalStep, FormStep, WorkflowStep } from '@fieldform/types';
import { trpc } from '@/trpc/client';
import { BranchStepsEditor } from './branch-steps-editor';

interface ConditionalStepEditorProps {
  step: ConditionalStep;
  allSteps: WorkflowStep[];
  currentStepIndex: number;
  onChange: (updates: Partial<ConditionalStep>) => void;
}

type ConditionOperator = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';

// Type-aware value input for branch conditions
function BranchValueInput({
  fieldType,
  value,
  onChange,
}: {
  fieldType: string;
  value: any;
  onChange: (value: any) => void;
}) {
  // Checkbox field - show boolean selector
  if (fieldType === 'checkbox') {
    return (
      <select
        value={value === true || value === 'true' ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
        className="w-full h-8 px-2 text-xs border rounded-md bg-background"
      >
        <option value="true">Checked (Yes)</option>
        <option value="false">Unchecked (No)</option>
      </select>
    );
  }

  // Number field - show number input
  if (fieldType === 'number') {
    return (
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        placeholder="Enter number"
        className="w-full h-8 px-2 text-xs border rounded-md bg-background"
      />
    );
  }

  // Date field - show date input
  if (fieldType === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 text-xs border rounded-md bg-background"
      />
    );
  }

  // DateTime field - show datetime input
  if (fieldType === 'datetime') {
    return (
      <input
        type="datetime-local"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 text-xs border rounded-md bg-background"
      />
    );
  }

  // Default - show text input
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value"
      className="w-full h-8 px-2 text-xs border rounded-md bg-background"
    />
  );
}

export function ConditionalStepEditor({
  step,
  allSteps,
  currentStepIndex,
  onChange,
}: ConditionalStepEditorProps) {
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set([0]));
  const [sourceFormFields, setSourceFormFields] = useState<Array<{ id: string; label: string; type: string }>>([]);

  // Get form template data when source step changes
  const sourceStep = allSteps
    .slice(0, currentStepIndex)
    .find(s => s.id === step.config.sourceStepId);

  const isFormStep = sourceStep && sourceStep.type === 'form';
  const formTemplateId = isFormStep ? (sourceStep as FormStep).config.formTemplateId : null;

  const { data: template } = trpc.forms.getTemplate.useQuery(
    { id: formTemplateId! },
    { enabled: !!formTemplateId }
  );

  // Extract fields from template
  useEffect(() => {
    if (template) {
      const fields: Array<{ id: string; label: string; type: string }> = [];

      // Handle different template structures
      const sections = template.sections || (template as any).schema?.sections || [];

      sections.forEach((section: any) => {
        if (section.fields && Array.isArray(section.fields)) {
          section.fields.forEach((field: any) => {
            fields.push({
              id: field.id,
              label: field.label,
              type: field.type,
            });
          });
        }
      });

      setSourceFormFields(fields);
    } else {
      setSourceFormFields([]);
    }
  }, [template]);

  // Previous steps that can be used as sources
  const previousSteps = allSteps.slice(0, currentStepIndex);

  const toggleBranch = (index: number) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBranches(newExpanded);
  };

  const addBranch = () => {
    const newBranch = {
      condition: {
        operator: 'equals' as ConditionOperator,
        value: '',
      },
      nextSteps: [],
    };
    onChange({
      config: {
        ...step.config,
        branches: [...step.config.branches, newBranch],
      },
    });
    // Expand the new branch
    setExpandedBranches(new Set([...expandedBranches, step.config.branches.length]));
  };

  const removeBranch = (index: number) => {
    const newBranches = step.config.branches.filter((_, i) => i !== index);
    onChange({
      config: {
        ...step.config,
        branches: newBranches,
      },
    });
    // Remove from expanded set
    const newExpanded = new Set(expandedBranches);
    newExpanded.delete(index);
    setExpandedBranches(newExpanded);
  };

  const updateBranch = (index: number, updates: Partial<typeof step.config.branches[0]>) => {
    const newBranches = [...step.config.branches];
    newBranches[index] = { ...newBranches[index], ...updates };
    onChange({
      config: {
        ...step.config,
        branches: newBranches,
      },
    });
  };

  const updateBranchCondition = (
    index: number,
    conditionUpdates: Partial<typeof step.config.branches[0]['condition']>
  ) => {
    const newBranches = [...step.config.branches];
    newBranches[index] = {
      ...newBranches[index],
      condition: {
        ...newBranches[index].condition,
        ...conditionUpdates,
      },
    };
    onChange({
      config: {
        ...step.config,
        branches: newBranches,
      },
    });
  };

  const selectedField = sourceFormFields.find(f => f.id === step.config.fieldId);

  // Get operators for the selected field type
  const getOperatorsForFieldType = (fieldType: string): Array<{ value: ConditionOperator; label: string }> => {
    const allOperators = [
      { value: 'equals' as ConditionOperator, label: 'Equals', types: ['text', 'number', 'select', 'radio', 'checkbox', 'date'] },
      { value: 'contains' as ConditionOperator, label: 'Contains', types: ['text', 'textarea', 'multiselect'] },
      { value: 'greater_than' as ConditionOperator, label: 'Greater Than', types: ['number', 'date'] },
      { value: 'less_than' as ConditionOperator, label: 'Less Than', types: ['number', 'date'] },
      { value: 'in' as ConditionOperator, label: 'In List', types: ['text', 'number', 'select'] },
      { value: 'not_in' as ConditionOperator, label: 'Not In List', types: ['text', 'number', 'select'] },
    ];

    return allOperators.filter(op => op.types.includes(fieldType));
  };

  return (
    <div className="space-y-4">
      {/* Source Step Selection */}
      <div>
        <Label className="text-xs">Source Step</Label>
        <select
          value={step.config.sourceStepId || ''}
          onChange={(e) =>
            onChange({
              config: {
                ...step.config,
                sourceStepId: e.target.value,
                fieldId: '', // Reset field when step changes
              },
            })
          }
          className="w-full h-9 px-3 text-sm border rounded-md bg-background"
        >
          <option value="">Select a previous step...</option>
          {previousSteps.map((s, idx) => (
            <option key={s.id} value={s.id}>
              Step {idx + 1}: {s.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Choose which previous step to evaluate
        </p>
      </div>

      {/* Field Selection */}
      {step.config.sourceStepId && (
        <div>
          <Label className="text-xs">Field to Check</Label>
          <select
            value={step.config.fieldId || ''}
            onChange={(e) =>
              onChange({
                config: {
                  ...step.config,
                  fieldId: e.target.value,
                },
              })
            }
            className="w-full h-9 px-3 text-sm border rounded-md bg-background"
            disabled={sourceFormFields.length === 0}
          >
            <option value="">
              {sourceFormFields.length === 0 ? 'No fields available' : 'Select a field...'}
            </option>
            {sourceFormFields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label} ({field.type})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Which field value should determine the branch?
          </p>
        </div>
      )}

      {/* Branches */}
      {step.config.fieldId && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs">Conditional Branches</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addBranch}
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Branch
            </Button>
          </div>

          <div className="space-y-2">
            {step.config.branches.map((branch, index) => (
              <div key={index} className="border rounded-md bg-muted/20">
                {/* Branch Header */}
                <div className="p-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBranch(index)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {expandedBranches.has(index) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <span className="text-sm font-medium flex-1">
                      Branch {index + 1}
                      {!expandedBranches.has(index) && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {branch.condition.operator} &quot;
                          {selectedField?.type === 'checkbox'
                            ? branch.condition.value === true || branch.condition.value === 'true'
                              ? 'Checked'
                              : 'Unchecked'
                            : String(branch.condition.value || '')}
                          &quot;
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBranch(index)}
                      className="h-7 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Branch Content */}
                {expandedBranches.has(index) && (
                  <div className="p-3 space-y-3">
                    {/* Condition */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Operator</Label>
                        <select
                          value={branch.condition.operator}
                          onChange={(e) =>
                            updateBranchCondition(index, {
                              operator: e.target.value as ConditionOperator,
                            })
                          }
                          className="w-full h-8 px-2 text-xs border rounded-md bg-background"
                        >
                          {getOperatorsForFieldType(selectedField?.type || 'text').map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Value</Label>
                        <BranchValueInput
                          fieldType={selectedField?.type || 'text'}
                          value={branch.condition.value}
                          onChange={(value) => updateBranchCondition(index, { value })}
                        />
                      </div>
                    </div>

                    {/* Next Steps Editor */}
                    <BranchStepsEditor
                      steps={branch.nextSteps}
                      onStepsChange={(newSteps) => updateBranch(index, { nextSteps: newSteps })}
                      label="Steps to execute if condition matches"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Branch */}
      {step.config.fieldId && step.config.branches.length > 0 && (
        <div className="p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <BranchStepsEditor
            steps={step.config.defaultBranch || []}
            onStepsChange={(newSteps) =>
              onChange({
                config: {
                  ...step.config,
                  defaultBranch: newSteps,
                },
              })
            }
            label="Default Branch (if no conditions match)"
          />
        </div>
      )}

      {/* Validation Warning */}
      {(!step.config.sourceStepId || !step.config.fieldId) && (
        <div className="p-3 border rounded-md bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ⚠️ Please select a source step and field to configure branches
          </p>
        </div>
      )}
    </div>
  );
}
