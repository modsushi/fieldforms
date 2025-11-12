'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, Button } from '@fieldform/ui';
import { GripVertical, Plus, Settings, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SectionCardProps {
  section: {
    id: string;
    title: string;
    description?: string;
    visible?: any;
  };
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onAddField: () => void;
  canDelete: boolean;
}

export function SectionCard({
  section,
  children,
  onEdit,
  onDelete,
  onAddField,
  canDelete,
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasConditional = section.visible?.type === 'rule';

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4 border-2 border-dashed border-gray-300 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <button
                className="cursor-move hover:bg-gray-100 p-1 rounded"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-gray-400" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  {hasConditional && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Conditional
                    </span>
                  )}
                </div>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Settings className="h-4 w-4" />
              </Button>
              {canDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="pt-0">
            {children}
            <Button
              variant="outline"
              size="sm"
              onClick={onAddField}
              className="w-full mt-3 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field to This Section
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
