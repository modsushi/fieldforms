'use client';

import { FormStep } from '@fieldform/types';
import { FormRenderer } from '@/components/form-renderer';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@fieldform/ui';

interface FormStepProps {
  step: FormStep;
  workOrderId: string;
  stepIndex: number;
  onComplete: (data: any) => void;
  isSubmitting?: boolean;
}

export function FormStepComponent({
  step,
  workOrderId,
  stepIndex,
  onComplete,
  isSubmitting = false,
}: FormStepProps) {
  const { data: template, isLoading } = trpc.forms.getTemplate.useQuery({
    id: step.config.formTemplateId,
  });

  const { data: entity } = trpc.entities.getById.useQuery(
    { id: step.config.entityId! },
    { enabled: !!step.config.entityId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading form...</CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Form template not found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Entity Context */}
      {entity && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">Entity Context</CardTitle>
            <CardDescription>
              This form is linked to: <strong>{entity.name}</strong>
              {entity.entityType && ` (${entity.entityType})`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Step Description */}
      {step.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{step.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <FormRenderer
        template={template as any}
        onSubmit={onComplete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

