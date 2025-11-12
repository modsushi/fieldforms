'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@fieldform/ui';
import { Priority } from '@prisma/client';
import { ClipboardList } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workflowId: '',
    assignedToTeamId: '',
    priority: 'MEDIUM' as Priority,
    dueDate: '',
  });

  const { data: workflows } = trpc.workflows.list.useQuery({});
  const { data: teams } = trpc.teams.list.useQuery();
  const createMutation = trpc.workOrders.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const workOrder = await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        workflowId: formData.workflowId,
        assignedToTeamId: formData.assignedToTeamId || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });

      alert('Work order created successfully!');
      router.push(`/dashboard/work-orders/${workOrder.id}`);
    } catch (error) {
      console.error('Failed to create work order:', error);
      alert('Failed to create work order. Please try again.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Create Work Order</h1>
              <p className="text-sm text-muted-foreground">
                Create a new work order and assign it to a team
              </p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/work-orders')}
              >
                ← Back to Work Orders
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-12 max-w-3xl">
        <Card className="mb-8 border bg-card/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Work Order Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Site Inspection - Main Building"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide details about this work order..."
                />
              </div>

              {/* Workflow */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Workflow Template <span className="text-red-500">*</span>
                </label>
                <select
                  name="workflowId"
                  value={formData.workflowId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a workflow...</option>
                  {workflows?.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Currently using form templates. Workflow builder coming soon.
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Team Assignment */}
              <div>
                <label className="block text-sm font-medium mb-2">Assign to Team</label>
                <select
                  name="assignedToTeamId"
                  value={formData.assignedToTeamId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.members.length} members)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  You can assign or reassign later
                </p>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Work Order'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/work-orders')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

