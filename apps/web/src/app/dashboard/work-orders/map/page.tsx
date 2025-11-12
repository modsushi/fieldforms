'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import type { Entity } from '@fieldform/types';
import { EntitySelector } from '@/components/map/EntitySelector';
import { Button } from '@fieldform/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@fieldform/ui';
import { ArrowLeft, Map, Plus, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Map-based work order creation page
 * Allows users to select entities on a map and create work orders for them
 */
export default function MapWorkOrderPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: entitiesData, isLoading } = trpc.entities.getAll.useQuery({
    limit: 500, // Get more entities for map view
  });

  const { data: workflowsData } = trpc.workflows.list.useQuery({});
  const { data: teamsData } = trpc.teams.list.useQuery();

  const entities = entitiesData?.items || [];
  const workflows = workflowsData?.items || [];
  const teams = teamsData?.items || [];

  const selectedEntities = entities.filter(e => selectedIds.has(e.id));

  const handleCreateWorkOrder = () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one entity from the map');
      return;
    }
    setShowConfirm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <Map className="h-6 w-6 text-primary" />
                Map-Based Work Order Creation
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select entities on the map to create work orders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/work-orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-8">
        {/* Instructions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Map className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">How to use:</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Choose a selection mode (Click, Polygon, or Circle)</li>
                  <li>2. Select entities on the map</li>
                  <li>3. Click "Create Work Order" to proceed</li>
                </ol>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {selectedIds.size}
                </div>
                <div className="text-xs text-muted-foreground">
                  entities selected
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Selector */}
        {isLoading ? (
          <Card>
            <CardContent className="py-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading entities...</p>
              </div>
            </CardContent>
          </Card>
        ) : entities.length === 0 ? (
          <Card>
            <CardContent className="py-20 flex flex-col items-center justify-center">
              <Map className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold mb-2">No entities found</p>
              <p className="text-sm text-muted-foreground mb-6">
                Create some entities with location data first
              </p>
              <Link href="/dashboard/entities">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Go to Entities
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EntitySelector
            entities={entities as Entity[]}
            onSelectionChange={setSelectedIds}
            height="calc(100vh - 450px)"
            showTools={true}
            multiSelect={true}
          />
        )}

        {/* Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-sm shadow-lg">
            <div className="container mx-auto px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {selectedIds.size} {selectedIds.size === 1 ? 'entity' : 'entities'} selected
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedEntities.slice(0, 3).map(e => e.name).join(', ')}
                    {selectedEntities.length > 3 && ` and ${selectedEntities.length - 3} more`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleCreateWorkOrder}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Work Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <WorkOrderConfirmModal
          selectedEntities={selectedEntities}
          workflows={workflows}
          teams={teams}
          onClose={() => setShowConfirm(false)}
          onSuccess={(workOrderId) => {
            setShowConfirm(false);
            router.push(`/dashboard/work-orders/${workOrderId}`);
          }}
        />
      )}
    </div>
  );
}

interface WorkOrderConfirmModalProps {
  selectedEntities: any[];
  workflows: any[];
  teams: any[];
  onClose: () => void;
  onSuccess: (workOrderId: string) => void;
}

function WorkOrderConfirmModal({
  selectedEntities,
  workflows,
  teams,
  onClose,
  onSuccess,
}: WorkOrderConfirmModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workflowId: '',
    assignedToTeamId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: '',
  });

  const createWorkOrder = trpc.workOrders.create.useMutation({
    onSuccess: (data) => {
      onSuccess(data.id);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.workflowId) {
      alert('Please select a workflow');
      return;
    }

    // Create work order with iterator step configured for selected entities
    createWorkOrder.mutate({
      title: formData.title,
      description: formData.description,
      workflowId: formData.workflowId,
      assignedToTeamId: formData.assignedToTeamId || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      // Note: In a real implementation, you'd need to configure the workflow
      // to iterate over these specific entities
      metadata: {
        selectedEntityIds: selectedEntities.map(e => e.id),
        createdFromMap: true,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Work Order</CardTitle>
              <CardDescription>
                Configure work order for {selectedEntities.length} selected {selectedEntities.length === 1 ? 'entity' : 'entities'}
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Entities Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">Selected Entities:</div>
              <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                {selectedEntities.map((e, i) => (
                  <div key={e.id}>
                    {i + 1}. {e.name} ({e.entityType})
                  </div>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter work order title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter description"
                rows={3}
              />
            </div>

            {/* Workflow */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Workflow *</label>
              <select
                value={formData.workflowId}
                onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select a workflow</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Assign to Team</label>
              <select
                value={formData.assignedToTeamId}
                onChange={(e) => setFormData({ ...formData, assignedToTeamId: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createWorkOrder.isLoading} className="gap-2">
                {createWorkOrder.isLoading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Work Order
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
