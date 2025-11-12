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

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
];

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
    const newConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition
    );
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
          {conditions.map((condition, index) => (
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
                      {field.label}
                    </option>
                  ))}
                </select>

                {/* Operator Selector */}
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(index, {
                      operator: e.target.value as Condition['operator'],
                    })
                  }
                  className="px-3 py-2 text-sm border rounded-md bg-background"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value Input */}
                <input
                  type="text"
                  value={condition.value || ''}
                  onChange={(e) =>
                    updateCondition(index, { value: e.target.value })
                  }
                  placeholder="Value"
                  className="px-3 py-2 text-sm border rounded-md bg-background"
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
          ))}
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
                const operator = OPERATORS.find(
                  (op) => op.value === condition.operator
                );
                return (
                  <li key={index} className="text-muted-foreground">
                    • {field?.label || 'Unknown Field'}{' '}
                    {operator?.label.toLowerCase() || condition.operator}{' '}
                    <strong>&quot;{condition.value}&quot;</strong>
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

