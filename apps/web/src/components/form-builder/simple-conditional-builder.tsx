'use client';

import { useState } from 'react';
import { Button } from '@fieldform/ui';
import { Plus, X } from 'lucide-react';

interface Condition {
  field: string;
  operator: string;
  value: any;
}

interface SimpleConditionalBuilderProps {
  value: any;
  onChange: (value: any) => void;
  availableFields: Array<{ id: string; label: string; type: string }>;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'Is One Of' },
  { value: 'not_in', label: 'Is Not One Of' },
];

export function SimpleConditionalBuilder({
  value,
  onChange,
  availableFields,
}: SimpleConditionalBuilderProps) {
  const conditions: Condition[] = value?.value?.conditions?.all || [];
  const logicType = value?.value?.conditions?.all ? 'all' : value?.value?.conditions?.any ? 'any' : 'all';

  const handleAddCondition = () => {
    const newCondition: Condition = {
      field: availableFields[0]?.id || '',
      operator: 'equals',
      value: '',
    };

    const updatedConditions = [...conditions, newCondition];
    updateConditional(updatedConditions, logicType);
  };

  const handleRemoveCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    if (updated.length === 0) {
      onChange(null);
    } else {
      updateConditional(updated, logicType);
    }
  };

  const handleUpdateCondition = (index: number, updates: Partial<Condition>) => {
    const updated = conditions.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    );
    updateConditional(updated, logicType);
  };

  const handleLogicTypeChange = (newLogicType: string) => {
    updateConditional(conditions, newLogicType);
  };

  const updateConditional = (conds: Condition[], logic: string) => {
    onChange({
      type: 'rule',
      value: {
        conditions: {
          [logic]: conds,
        },
      },
    });
  };

  const handleClearAll = () => {
    onChange(null);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      {conditions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No conditions set. This section will always be visible.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            disabled={availableFields.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
          {availableFields.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Add fields to the form before creating conditions
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Logic Type Selector */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <span className="text-sm font-medium">Show when:</span>
            <select
              value={logicType}
              onChange={(e) => handleLogicTypeChange(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="all">ALL conditions are met (AND)</option>
              <option value="any">ANY condition is met (OR)</option>
            </select>
          </div>

          {/* Conditions */}
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-start gap-2 bg-white p-3 rounded border">
              <div className="flex-1 grid grid-cols-3 gap-2">
                {/* Field */}
                <div>
                  <label className="block text-xs font-medium mb-1">Field</label>
                  <select
                    value={condition.field}
                    onChange={(e) => handleUpdateCondition(index, { field: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  >
                    {availableFields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label || field.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div>
                  <label className="block text-xs font-medium mb-1">Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => handleUpdateCondition(index, { operator: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs font-medium mb-1">Value</label>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
                    placeholder="Enter value..."
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  />
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveCondition(index)}
                className="mt-6 hover:bg-red-50 p-1.5 rounded text-red-500"
                title="Remove condition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              disabled={availableFields.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-600"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
