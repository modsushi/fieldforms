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
import { SectionCard } from '@/components/form-builder/section-card';
import { SectionEditorDialog } from '@/components/form-builder/section-editor-dialog';
import { FIELD_TYPES } from '@/components/form-builder/field-types-config';
import { Button } from '@fieldform/ui';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { Plus, Layers } from 'lucide-react';

interface ExtendedFormField extends FormField {
  id: string;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  visible?: any;
  fields: ExtendedFormField[];
}

export default function EnhancedFormBuilderPage() {
  const router = useRouter();
  const [formName, setFormName] = useState('New Form');
  const [formDescription, setFormDescription] = useState('');
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'section-1',
      title: 'General Information',
      fields: [],
    },
  ]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);

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

  // Get all fields from all sections for conditional logic
  const allFields = sections.flatMap(section =>
    section.fields.map(field => ({
      id: field.id,
      label: field.label,
      type: field.type,
    }))
  );

  // Get fields from previous sections for conditional logic (fields in earlier sections)
  const getAvailableFieldsForSection = (sectionIndex: number) => {
    return sections
      .slice(0, sectionIndex)
      .flatMap(section =>
        section.fields.map(field => ({
          id: field.id,
          label: field.label,
          type: field.type,
        }))
      );
  };

  const handleAddSection = () => {
    setEditingSectionId(null);
    setIsSectionDialogOpen(true);
  };

  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId);
    setIsSectionDialogOpen(true);
  };

  const handleSaveSection = (data: { title: string; description?: string; visible?: any }) => {
    if (editingSectionId) {
      // Update existing section
      setSections(sections.map(s =>
        s.id === editingSectionId
          ? { ...s, ...data }
          : s
      ));
    } else {
      // Create new section
      const newSection: Section = {
        id: `section-${Date.now()}`,
        ...data,
        fields: [],
      };
      setSections([...sections, newSection]);
    }
    setIsSectionDialogOpen(false);
    setEditingSectionId(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length === 1) {
      alert('Cannot delete the last section');
      return;
    }
    if (confirm('Are you sure you want to delete this section? All fields in it will be lost.')) {
      setSections(sections.filter(s => s.id !== sectionId));
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
        setSelectedFieldId(null);
      }
    }
  };

  const handleAddFieldToSection = (sectionId: string, fieldType: string) => {
    const fieldConfig = FIELD_TYPES.find((ft) => ft.type === fieldType);
    if (!fieldConfig) return;

    const newField: ExtendedFormField = {
      ...fieldConfig.defaultConfig,
      id: `field_${Date.now()}`,
    } as ExtendedFormField;

    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, fields: [...s.fields, newField] }
        : s
    ));

    setSelectedFieldId(newField.id);
    setSelectedSectionId(sectionId);
  };

  const handleDeleteField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) }
        : s
    ));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            fields: s.fields.map(f =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          }
        : s
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find which section contains the active item
    const activeSection = sections.find(s => s.fields.some(f => f.id === active.id));
    if (!activeSection) return;

    const oldIndex = activeSection.fields.findIndex(f => f.id === active.id);
    const newIndex = activeSection.fields.findIndex(f => f.id === over.id);

    setSections(sections.map(s =>
      s.id === activeSection.id
        ? { ...s, fields: arrayMove(s.fields, oldIndex, newIndex) }
        : s
    ));
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    setSections(arrayMove(sections, oldIndex, newIndex));
  };

  const handleSaveForm = () => {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    if (sections.length === 0) {
      alert('Please add at least one section');
      return;
    }

    const hasFields = sections.some(s => s.fields.length > 0);
    if (!hasFields) {
      alert('Please add at least one field to the form');
      return;
    }

    // Clean up sections and fields
    const cleanSections = sections.map(({ fields, ...section }) => ({
      ...section,
      fields: fields.map(({ id, ...field }) => field),
    }));

    createForm.mutate({
      name: formName,
      description: formDescription,
      category: 'Custom',
      schema: {
        sections: cleanSections,
      },
    });
  };

  const selectedField = selectedFieldId
    ? sections
        .find(s => s.id === selectedSectionId)
        ?.fields.find(f => f.id === selectedFieldId)
    : null;

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSectionIndex = sections.findIndex(s => s.id === selectedSectionId);

  const editingSection = editingSectionId
    ? sections.find(s => s.id === editingSectionId)
    : null;

  const availableFieldsForSection = selectedSectionIndex >= 0
    ? getAvailableFieldsForSection(selectedSectionIndex)
    : [];

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
          <Button variant="outline" onClick={handleAddSection}>
            <Layers className="h-4 w-4 mr-2" />
            Add Section
          </Button>
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
        <FieldPalette
          onAddField={(fieldType) => {
            if (selectedSectionId) {
              handleAddFieldToSection(selectedSectionId, fieldType);
            } else if (sections.length > 0) {
              handleAddFieldToSection(sections[0].id, fieldType);
            }
          }}
        />

        {/* Canvas */}
        <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {sections.length === 0 ? (
              <div className="text-center py-16">
                <Layers className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  No sections yet
                </p>
                <Button onClick={handleAddSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Section
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onEdit={() => handleEditSection(section.id)}
                      onDelete={() => handleDeleteSection(section.id)}
                      onAddField={() => {
                        setSelectedSectionId(section.id);
                      }}
                      canDelete={sections.length > 1}
                    >
                      {section.fields.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No fields in this section yet. Click a field type on the left to add it.
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={section.fields.map((f) => f.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {section.fields.map((field) => (
                                <FieldItem
                                  key={field.id}
                                  field={field}
                                  isSelected={
                                    selectedFieldId === field.id &&
                                    selectedSectionId === section.id
                                  }
                                  onSelect={() => {
                                    setSelectedFieldId(field.id);
                                    setSelectedSectionId(section.id);
                                  }}
                                  onDelete={() => handleDeleteField(section.id, field.id)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </SectionCard>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedField && selectedSection && (
          <FieldPropertiesPanel
            field={selectedField}
            onUpdate={(updates) =>
              handleUpdateField(selectedSection.id, selectedField.id, updates)
            }
            availableFields={availableFieldsForSection}
          />
        )}
      </div>

      {/* Section Editor Dialog */}
      <SectionEditorDialog
        section={editingSection}
        isOpen={isSectionDialogOpen}
        onClose={() => {
          setIsSectionDialogOpen(false);
          setEditingSectionId(null);
        }}
        onSave={handleSaveSection}
        availableFields={allFields}
      />
    </div>
  );
}
