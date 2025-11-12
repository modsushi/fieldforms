'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@fieldform/ui';
import { FormStepComponent } from '@/components/workflow/steps/form-step';
import { isFormStep } from '@fieldform/types';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function OperatorWorkOrderPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { data: workOrder, refetch: refetchWorkOrder } = trpc.workOrders.getById.useQuery({ id });
  const { data: progressData, refetch: refetchProgress } = trpc.workOrders.getProgress.useQuery({ workOrderId: id });
  const submitFormMutation = trpc.forms.submitForm.useMutation();
  const completeStepMutation = trpc.workOrders.completeStep.useMutation();

  const handleStepComplete = async (data: any) => {
    if (!workOrder || !progressData) return;

    const currentStepIndex = progressData.workOrder.currentStepIndex;
    const totalSteps = progressData.progress.totalSteps;

    setSubmitting(true);
    try {
      // Submit the form
      const submission = await submitFormMutation.mutateAsync({
        formTemplateId: (progressData.currentStep as any).config.formTemplateId,
        data,
        workOrderId: id,
        deviceInfo: {
          deviceId: 'web-browser',
          platform: 'web',
          osVersion: navigator.userAgent,
          appVersion: '1.0.0',
        },
      });

      // Complete the step using the new endpoint
      await completeStepMutation.mutateAsync({
        workOrderId: id,
        stepIndex: currentStepIndex,
        submissionId: submission.id,
      });

      // Refetch to get updated progress
      await refetchWorkOrder();
      await refetchProgress();

      // Check if this was the last step
      if (currentStepIndex >= totalSteps - 1) {
        alert('Work order completed! Great job!');
        router.push('/operator');
      } else {
        alert('Step completed! Moving to next step...');
      }
    } catch (error: any) {
      console.error('Failed to complete step:', error);
      alert(error.message || 'Failed to complete step. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!workOrder || !progressData) {
    return <div className="p-8">Loading work order...</div>;
  }

  const currentStep = progressData.currentStep;
  const currentStepIndex = progressData.workOrder.currentStepIndex;
  const totalSteps = progressData.progress.totalSteps;
  const percentage = progressData.progress.percentage;

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No active step found for this work order.
              </p>
              <Button onClick={() => router.push('/operator')}>
                ← Back to My Work
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold">{workOrder.title}</h1>
              <p className="text-sm text-muted-foreground">{currentStep.name}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm rounded ${
                statusColors[workOrder.status]
              }`}
            >
              {workOrder.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span>{Math.round(percentage)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step Title */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {currentStep.name}
              {currentStep.description && (
                <p className="text-sm font-normal text-muted-foreground mt-2">
                  {currentStep.description}
                </p>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Render Step Content */}
        {isFormStep(currentStep) ? (
          <FormStepComponent
            step={currentStep}
            workOrderId={id}
            stepIndex={currentStepIndex}
            onComplete={handleStepComplete}
            isSubmitting={submitting}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                This step type is not yet supported in the UI.
              </p>
              <p className="text-sm text-muted-foreground">
                Step type: {currentStep.type}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/operator')}
            className="flex-1"
          >
            ← Back to My Work
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              refetchWorkOrder();
              refetchProgress();
            }}
            className="flex-1"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
