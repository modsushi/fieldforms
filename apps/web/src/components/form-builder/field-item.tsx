'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@fieldform/types';
import { FIELD_TYPES } from './field-types-config';

interface FieldItemProps {
  field: FormField & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function FieldItem({ field, isSelected, onSelect, onDelete }: FieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: field.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldConfig = FIELD_TYPES.find((ft) => ft.type === field.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      className={`
        p-4 border rounded-lg bg-white cursor-pointer
        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-gray-400'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{fieldConfig?.icon}</span>
            <span className="font-medium text-sm">{field.label}</span>
            {field.required && (
              <span className="text-red-500 text-xs">*required</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {fieldConfig?.label} • {field.id}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

