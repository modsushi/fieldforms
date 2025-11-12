'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@fieldform/ui';
import { Plus, Trash2, X } from 'lucide-react';
import { ConditionalRule, Condition } from '@fieldform/types';

interface ConditionalRuleBuilderProps {
  fields: Array<{ id: string; label: string; type: string }>;
  rule?: ConditionalRule;
  onChange: (rule: ConditionalRule | undefined) => void;
  onClose?: () => void;
}

type OperatorConfig = {
  value: string;
  label: string;
  supportedTypes: string[];
};

// Operators with their supported field types
const ALL_OPERATORS: OperatorConfig[] = [
  { value: 'equals', label: 'Equals', supportedTypes: ['text', 'number', 'select', 'radio', 'checkbox', 'date', 'datetime', 'entity_selector', 'form_selector'] },
  { value: 'not_equals', label: 'Not Equals', supportedTypes: ['text', 'number', 'select', 'radio', 'checkbox', 'date', 'datetime', 'entity_selector', 'form_selector'] },
  { value: 'contains', label: 'Contains', supportedTypes: ['text', 'textarea', 'multiselect'] },
  { value: 'not_contains', label: 'Does Not Contain', supportedTypes: ['text', 'textarea', 'multiselect'] },
  { value: 'greater_than', label: 'Greater Than', supportedTypes: ['number', 'date', 'datetime'] },
  { value: 'less_than', label: 'Less Than', supportedTypes: ['number', 'date', 'datetime'] },
  { value: 'in', label: 'In List', supportedTypes: ['text', 'number', 'select', 'multiselect'] },
  { value: 'not_in', label: 'Not In List', supportedTypes: ['text', 'number', 'select', 'multiselect'] },
];

// Get operators valid for a specific field type
function getOperatorsForFieldType(fieldType: string): OperatorConfig[] {
  return ALL_OPERATORS.filter(op => op.supportedTypes.includes(fieldType));
}

// Type-aware value input component
function ValueInput({
  fieldType,
  value,
  onChange,
  fieldOptions,
}: {
  fieldType: string;
  value: any;
  onChange: (value: any) => void;
  fieldOptions?: Array<{ label: string; value: string }>;
}) {
  // Checkbox field - show boolean selector
  if (fieldType === 'checkbox') {
    return (
      <select
        value={value === true || value === 'true' ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
        className="px-3 py-2 text-sm border rounded-md bg-background"
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
        className="px-3 py-2 text-sm border rounded-md bg-background"
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
        className="px-3 py-2 text-sm border rounded-md bg-background"
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
        className="px-3 py-2 text-sm border rounded-md bg-background"
      />
    );
  }

  // Select/Radio with options - show dropdown
  if ((fieldType === 'select' || fieldType === 'radio') && fieldOptions && fieldOptions.length > 0) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm border rounded-md bg-background"
      >
        <option value="">Select value...</option>
        {fieldOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // Textarea - show textarea
  if (fieldType === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter text"
        rows={2}
        className="px-3 py-2 text-sm border rounded-md bg-background"
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
      className="px-3 py-2 text-sm border rounded-md bg-background"
    />
  );
}

export function ConditionalRuleBuilder({
  fields,
  rule,
  onChange,
  onClose,
}: ConditionalRuleBuilderProps) {
  const [conditions, setConditions] = useState<Condition[]>(() => {
    if (rule && typeof rule.value === 'object' && 'conditions' in rule.value) {
      return rule.value.conditions.all || [];
    }
    return [];
  });

  const [logicType, setLogicType] = useState<'all' | 'any'>('all');

  const addCondition = () => {
    const newCondition: Condition = {
      field: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    updateRule(newConditions);
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = conditions.map((condition, i) => {
      if (i !== index) return condition;

      const updated = { ...condition, ...updates };

      // If field changed, validate operator and reset if not compatible
      if (updates.field !== undefined) {
        const newField = fields.find(f => f.id === updates.field);
        if (newField) {
          const validOperators = getOperatorsForFieldType(newField.type);
          const isOperatorValid = validOperators.some(op => op.value === updated.operator);

          if (!isOperatorValid) {
            // Reset to first valid operator
            updated.operator = validOperators[0]?.value || 'equals';
          }

          // Reset value when field changes
          updated.value = newField.type === 'checkbox' ? false : '';
        }
      }

      return updated;
    });
    setConditions(newConditions);
    updateRule(newConditions);
  };

  const updateRule = (newConditions: Condition[]) => {
    if (newConditions.length === 0) {
      onChange(undefined);
      return;
    }

    const newRule: ConditionalRule = {
      type: 'rule',
      value: {
        conditions: {
          [logicType]: newConditions,
        },
      },
    };

    onChange(newRule);
  };

  const clearRule = () => {
    setConditions([]);
    onChange(undefined);
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conditional Logic</CardTitle>
          <div className="flex items-center gap-2">
            {conditions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearRule}
                className="text-destructive"
              >
                Clear All
              </Button>
            )}
            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Show this field only when these conditions are met
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logic Type Selector */}
        {conditions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Match:</span>
            <select
              value={logicType}
              onChange={(e) => {
                const newType = e.target.value as 'all' | 'any';
                setLogicType(newType);
                updateRule(conditions);
              }}
              className="px-3 py-1.5 text-sm border rounded-md bg-background"
            >
              <option value="all">All conditions (AND)</option>
              <option value="any">Any condition (OR)</option>
            </select>
          </div>
        )}

        {/* Conditions List */}
        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const selectedField = fields.find(f => f.id === condition.field);
            const fieldType = selectedField?.type || 'text';
            const availableOperators = selectedField
              ? getOperatorsForFieldType(fieldType)
              : ALL_OPERATORS;

            return (
              <div
                key={index}
                className="flex gap-2 items-start p-3 border rounded-md bg-muted/30"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Field Selector */}
                  <select
                    value={condition.field}
                    onChange={(e) =>
                      updateCondition(index, { field: e.target.value })
                    }
                    className="px-3 py-2 text-sm border rounded-md bg-background"
                  >
                    <option value="">Select Field</option>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label} ({field.type})
                      </option>
                    ))}
                  </select>

                  {/* Operator Selector - Type-aware */}
                  <select
                    value={condition.operator}
                    onChange={(e) =>
                      updateCondition(index, {
                        operator: e.target.value as Condition['operator'],
                      })
                    }
                    className="px-3 py-2 text-sm border rounded-md bg-background"
                  >
                    {availableOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value Input - Type-aware */}
                  <ValueInput
                    fieldType={fieldType}
                    value={condition.value}
                    onChange={(value) => updateCondition(index, { value })}
                  />
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  className="text-destructive mt-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add Condition Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCondition}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Condition
        </Button>

        {/* Preview */}
        {conditions.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-md border">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Preview:
            </p>
            <p className="text-sm">
              Show field when{' '}
              <strong>{logicType === 'all' ? 'ALL' : 'ANY'}</strong> of:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              {conditions.map((condition, index) => {
                const field = fields.find((f) => f.id === condition.field);
                const operator = ALL_OPERATORS.find(
                  (op) => op.value === condition.operator
                );

                // Format value display based on field type
                let displayValue = condition.value;
                if (field?.type === 'checkbox') {
                  displayValue = condition.value === true || condition.value === 'true' ? 'Checked (Yes)' : 'Unchecked (No)';
                } else if (typeof condition.value === 'string' || typeof condition.value === 'number') {
                  displayValue = condition.value;
                } else {
                  displayValue = JSON.stringify(condition.value);
                }

                return (
                  <li key={index} className="text-muted-foreground">
                    • {field?.label || 'Unknown Field'}{' '}
                    {operator?.label.toLowerCase() || condition.operator}{' '}
                    <strong>&quot;{displayValue}&quot;</strong>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

