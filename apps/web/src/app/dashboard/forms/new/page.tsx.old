'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FormField } from '@fieldform/types';
import { FieldPalette } from '@/components/form-builder/field-palette';
import { FieldItem } from '@/components/form-builder/field-item';
import { FieldPropertiesPanel } from '@/components/form-builder/field-properties-panel';
import { FIELD_TYPES } from '@/components/form-builder/field-types-config';
import { Button } from '@fieldform/ui';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';

interface ExtendedFormField extends FormField {
  id: string;
}

export default function FormBuilderPage() {
  const router = useRouter();
  const [formName, setFormName] = useState('New Form');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<ExtendedFormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const createForm = trpc.forms.createTemplate.useMutation({
    onSuccess: (data) => {
      alert('Form created successfully!');
      router.push(`/dashboard/forms/${data.id}/fill`);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddField = (fieldType: string) => {
    const fieldConfig = FIELD_TYPES.find((ft) => ft.type === fieldType);
    if (!fieldConfig) return;

    const newField: ExtendedFormField = {
      ...fieldConfig.defaultConfig,
      id: `field_${Date.now()}`,
    } as ExtendedFormField;

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      )
    );
  };

  const handleSaveForm = () => {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    // Remove the temporary 'id' field from each field before saving
    const cleanFields = fields.map(({ id, ...field }) => field);

    createForm.mutate({
      name: formName,
      description: formDescription,
      category: 'Custom',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Form Fields',
            fields: cleanFields,
          },
        ],
      },
    });
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="text-xl font-bold border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            placeholder="Form Name"
          />
          <input
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="block mt-1 text-sm text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            placeholder="Add a description..."
          />
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/forms">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSaveForm} disabled={createForm.isLoading}>
            {createForm.isLoading ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Field Palette */}
        <FieldPalette onAddField={handleAddField} />

        {/* Canvas */}
        <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {fields.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-2">
                  No fields yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Click a field type on the left to add it
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <FieldItem
                        key={field.id}
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => setSelectedFieldId(field.id)}
                        onDelete={() => handleDeleteField(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedField && (
          <FieldPropertiesPanel
            field={selectedField}
            onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
          />
        )}
      </div>
    </div>
  );
}

