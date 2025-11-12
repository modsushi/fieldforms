'use client';

import { useForm } from 'react-hook-form';
import { FormTemplate } from '@fieldform/types';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@fieldform/ui';
import { FieldRenderer } from './field-renderer';
import {
  isSectionVisible,
  isFieldVisible,
  isFieldDisabled,
  isFieldRequired,
} from '@/lib/forms/conditional-evaluator';

interface FormRendererProps {
  template: FormTemplate;
  onSubmit: (data: any) => void | Promise<void>;
  initialData?: Record<string, any>;
  isSubmitting?: boolean;
}

export function FormRenderer({ 
  template, 
  onSubmit, 
  initialData = {},
  isSubmitting = false 
}: FormRendererProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: initialData,
  });

  // Check if sections are in template.schema instead
  const sections = template.sections || (template.schema as any)?.sections || [];

  // Watch all form values for conditional logic
  const formData = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {sections.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No form fields found. Please check the form template.
        </div>
      )}
      {sections.map((section: any) => {
        // Check if section should be visible based on conditional rules
        const sectionVisible = isSectionVisible(section, formData);
        
        if (!sectionVisible) {
          return null; // Hide the entire section
        }

        return (
          <Card key={section.id}>
            {(section.title || section.description) && (
              <CardHeader>
                {section.title && <CardTitle>{section.title}</CardTitle>}
                {section.description && (
                  <CardDescription>{section.description}</CardDescription>
                )}
              </CardHeader>
            )}
            <CardContent className="space-y-4">
              {section.fields?.map((field: any, index: number) => {
                // Ensure field has an id
                const fieldWithId = {
                  ...field,
                  id: field.id || `field_${section.id}_${index}`,
                };

                // Check if field should be visible
                const fieldVisible = isFieldVisible(fieldWithId, formData);
                
                if (!fieldVisible) {
                  return null; // Hide this field
                }

                // Check if field should be disabled
                const fieldDisabled = isFieldDisabled(fieldWithId, formData);

                // Check if field is required (can be conditional)
                const fieldRequired = isFieldRequired(fieldWithId, formData);
                
                return (
                  <FieldRenderer
                    key={fieldWithId.id}
                    field={{
                      ...fieldWithId,
                      required: fieldRequired,
                      disabled: fieldDisabled,
                    }}
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

