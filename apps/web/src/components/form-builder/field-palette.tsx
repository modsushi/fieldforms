'use client';

import { FIELD_TYPES } from './field-types-config';
import { Card, CardHeader, CardTitle } from '@fieldform/ui';

interface FieldPaletteProps {
  onAddField: (type: string) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="w-64 bg-white border-r p-4 overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Field Types</h3>
      <div className="space-y-2">
        {FIELD_TYPES.map((fieldType) => (
          <button
            key={fieldType.type}
            onClick={() => onAddField(fieldType.type)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl">{fieldType.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{fieldType.label}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {fieldType.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Tips</CardTitle>
        </CardHeader>
        <div className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
          <p>• Click a field type to add it</p>
          <p>• Drag fields to reorder</p>
          <p>• Click fields to edit properties</p>
        </div>
      </Card>
    </div>
  );
}

