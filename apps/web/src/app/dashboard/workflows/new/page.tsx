'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@fieldform/ui';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'form' | 'conditional' | 'iterator' | 'locationMarker';
  description?: string;
  config: any;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'step-1',
      name: 'Step 1',
      type: 'form',
      description: '',
      config: {},
    },
  ]);

  const { data: formTemplatesData } = trpc.forms.getTemplates.useQuery({});
  const formTemplates = formTemplatesData?.items || [];

  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: (workflow) => {
      router.push(`/dashboard/workflows/${workflow.id}`);
    },
  });

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step-${steps.length + 1}`,
      name: `Step ${steps.length + 1}`,
      type: 'form',
      description: '',
      config: {},
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        description,
        definition: {
          steps: steps.map((step) => ({
            id: step.id,
            name: step.name,
            type: step.type,
            description: step.description,
            config: step.config,
          })),
        },
        isActive: true,
      });
    } catch (error: any) {
      alert(error.message || 'Failed to create workflow');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create Workflow</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Define a multi-step workflow for work orders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/workflows">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Cancel
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Workflow Information</CardTitle>
              <CardDescription>Basic details about this workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Site Inspection Workflow"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow is for..."
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflow Steps</CardTitle>
                  <CardDescription>Define the steps in order</CardDescription>
                </div>
                <Button type="button" size="sm" onClick={addStep} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Step Name</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(index, { name: e.target.value })}
                            placeholder={`Step ${index + 1}`}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Step Type</Label>
                          <select
                            value={step.type}
                            onChange={(e) =>
                              updateStep(index, {
                                type: e.target.value as WorkflowStep['type'],
                              })
                            }
                            className="w-full h-9 px-3 text-sm border rounded-md bg-background"
                          >
                            <option value="form">Form</option>
                            <option value="conditional">Conditional Branch</option>
                            <option value="iterator">Iterator (Loop)</option>
                            <option value="locationMarker">Location Marker</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={step.description || ''}
                          onChange={(e) => updateStep(index, { description: e.target.value })}
                          placeholder="Optional description"
                          className="h-9 text-sm"
                        />
                      </div>
                      {step.type === 'form' && formTemplates && (
                        <div>
                          <Label className="text-xs">Select Form Template</Label>
                          <select
                            value={step.config.formTemplateId || ''}
                            onChange={(e) =>
                              updateStep(index, {
                                config: { ...step.config, formTemplateId: e.target.value },
                              })
                            }
                            className="w-full h-9 px-3 text-sm border rounded-md bg-background"
                          >
                            <option value="">Select a form...</option>
                            {formTemplates.map((form) => (
                              <option key={form.id} value={form.id}>
                                {form.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    {steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/workflows">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

