'use client';

import { useState } from 'react';
import { Button, Label } from '@fieldform/ui';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { WorkflowStep, FormStep } from '@fieldform/types';
import { trpc } from '@/trpc/client';

interface BranchStepsEditorProps {
  steps: WorkflowStep[];
  onStepsChange: (steps: WorkflowStep[]) => void;
  label: string;
}

export function BranchStepsEditor({ steps, onStepsChange, label }: BranchStepsEditorProps) {
  const { data: formTemplatesData } = trpc.forms.getTemplates.useQuery({});
  const formTemplates = formTemplatesData?.items || [];

  const addStep = () => {
    const newStep: FormStep = {
      id: `branch-step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      type: 'form',
      config: {
        formTemplateId: '',
      },
    };
    onStepsChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    onStepsChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onStepsChange(newSteps);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addStep}
          className="h-6 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="p-3 border rounded-md bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground">
            No steps configured. Workflow will end here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="p-2 border rounded-md bg-background flex items-start gap-2"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />

              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Step Name</Label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(index, { name: e.target.value })}
                      placeholder="Step name"
                      className="w-full h-7 px-2 text-xs border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Step Type</Label>
                    <select
                      value={step.type}
                      disabled
                      className="w-full h-7 px-2 text-xs border rounded-md bg-muted"
                    >
                      <option value="form">Form</option>
                    </select>
                  </div>
                </div>

                {step.type === 'form' && (
                  <div>
                    <Label className="text-xs">Form Template</Label>
                    <select
                      value={(step as FormStep).config.formTemplateId || ''}
                      onChange={(e) =>
                        updateStep(index, {
                          config: {
                            ...(step as FormStep).config,
                            formTemplateId: e.target.value,
                          },
                        })
                      }
                      className="w-full h-7 px-2 text-xs border rounded-md bg-background"
                    >
                      <option value="">Select form...</option>
                      {formTemplates.map((form) => (
                        <option key={form.id} value={form.id}>
                          {form.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Description (optional)</Label>
                  <input
                    type="text"
                    value={step.description || ''}
                    onChange={(e) => updateStep(index, { description: e.target.value })}
                    placeholder="Step description"
                    className="w-full h-7 px-2 text-xs border rounded-md bg-background"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                className="h-6 w-6 p-0 text-destructive flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
