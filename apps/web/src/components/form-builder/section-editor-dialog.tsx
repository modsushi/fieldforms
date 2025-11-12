'use client';

import { useState, useEffect } from 'react';
import { Button } from '@fieldform/ui';
import { X } from 'lucide-react';
import { SimpleConditionalBuilder } from './simple-conditional-builder';

interface SectionEditorDialogProps {
  section: {
    id: string;
    title: string;
    description?: string;
    visible?: any;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    visible?: any;
  }) => void;
  availableFields: Array<{ id: string; label: string; type: string }>;
}

export function SectionEditorDialog({
  section,
  isOpen,
  onClose,
  onSave,
  availableFields,
}: SectionEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [conditional, setConditional] = useState<any>(null);

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setDescription(section.description || '');
      setConditional(section.visible || null);
    } else {
      setTitle('');
      setDescription('');
      setConditional(null);
    }
  }, [section, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a section title');
      return;
    }

    onSave({
      title,
      description: description || undefined,
      visible: conditional,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {section ? 'Edit Section' : 'New Section'}
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Section Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Personal Information"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what this section is for..."
              rows={2}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Conditional Logic */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Conditional Visibility (optional)
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Show this section only when certain conditions are met
            </p>
            <SimpleConditionalBuilder
              value={conditional}
              onChange={setConditional}
              availableFields={availableFields}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {section ? 'Update Section' : 'Create Section'}
          </Button>
        </div>
      </div>
    </div>
  );
}
