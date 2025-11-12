'use client';

import { FormField } from '@fieldform/types';
import { Input, Label } from '@fieldform/ui';
import { FIELD_TYPES } from './field-types-config';
import { SimpleConditionalBuilder } from './simple-conditional-builder';

interface FieldPropertiesPanelProps {
  field: FormField & { id: string };
  onUpdate: (updates: Partial<FormField>) => void;
  availableFields?: Array<{ id: string; label: string; type: string }>;
}

export function FieldPropertiesPanel({ field, onUpdate, availableFields = [] }: FieldPropertiesPanelProps) {
  const fieldConfig = FIELD_TYPES.find((ft) => ft.type === field.type);

  // Filter available fields to exclude the current field
  const otherFields = availableFields.filter(f => f.id !== field.id);

  return (
    <div className="w-80 bg-white border-l p-4 overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Field Properties</h3>

      <div className="space-y-4">
        {/* Field Type */}
        <div>
          <Label className="text-sm text-muted-foreground">Field Type</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{fieldConfig?.icon}</span>
            <span className="font-medium">{fieldConfig?.label}</span>
          </div>
        </div>

        {/* Label */}
        <div>
          <Label htmlFor="label">Label *</Label>
          <Input
            id="label"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
          />
        </div>

        {/* Help Text */}
        <div>
          <Label htmlFor="helpText">Help Text</Label>
          <Input
            id="helpText"
            value={field.helpText || ''}
            onChange={(e) => onUpdate({ helpText: e.target.value })}
            placeholder="Optional help text"
          />
        </div>

        {/* Placeholder (for text fields) */}
        {(field.type === 'text' || field.type === 'textarea') && (
          <div>
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder text"
            />
          </div>
        )}

        {/* Required */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4"
          />
          <Label htmlFor="required">Required field</Label>
        </div>

        {/* Options (for select/radio fields) */}
        {(field.type === 'select' || field.type === 'radio') && (
          <div>
            <Label>Options</Label>
            <div className="mt-2 space-y-2">
              {field.options?.source === 'static' &&
                Array.isArray(field.options.value) &&
                field.options.value.map((option: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(field.options?.value as any[])];
                        newOptions[index] = { ...option, label: e.target.value };
                        onUpdate({
                          options: { source: 'static', value: newOptions },
                        });
                      }}
                      placeholder="Option label"
                    />
                  </div>
                ))}
              <button
                onClick={() => {
                  const currentOptions = (field.options?.value as any[]) || [];
                  const newOptions = [
                    ...currentOptions,
                    {
                      label: `Option ${currentOptions.length + 1}`,
                      value: `option${currentOptions.length + 1}`,
                    },
                  ];
                  onUpdate({
                    options: { source: 'static', value: newOptions },
                  });
                }}
                className="text-sm text-primary hover:underline"
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        {/* Conditional Visibility */}
        <div className="pt-4 border-t">
          <Label className="mb-2 block">Conditional Visibility (optional)</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Show this field only when certain conditions are met
          </p>
          <SimpleConditionalBuilder
            value={field.visible}
            onChange={(value) => onUpdate({ visible: value })}
            availableFields={otherFields}
          />
        </div>
      </div>
    </div>
  );
}

