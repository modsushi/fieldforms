'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import { WorkOrderStatus } from '@prisma/client';
import { reportGenerator } from '@/lib/reports/generator';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: workOrder, isLoading, refetch } = trpc.workOrders.getById.useQuery({ id });
  const { data: progress } = trpc.workOrders.getProgress.useQuery({ workOrderId: id });
  const { data: teams } = trpc.teams.list.useQuery();

  const assignMutation = trpc.workOrders.assign.useMutation();
  const claimMutation = trpc.workOrders.claim.useMutation();
  const unclaimMutation = trpc.workOrders.unclaim.useMutation();
  const updateStatusMutation = trpc.workOrders.updateStatus.useMutation();
  const updateMutation = trpc.workOrders.update.useMutation();

  const handleAssign = async (teamId: string) => {
    try {
      await assignMutation.mutateAsync({ workOrderId: id, teamId });
      alert('Work order assigned successfully!');
      refetch();
    } catch (error) {
      alert('Failed to assign work order');
    }
  };

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync({ workOrderId: id });
      alert('Work order claimed!');
      refetch();
    } catch (error: any) {
      alert(error.message || 'Failed to claim work order');
    }
  };

  const handleUnclaim = async () => {
    try {
      await unclaimMutation.mutateAsync({ workOrderId: id });
      alert('Work order released!');
      refetch();
    } catch (error: any) {
      alert(error.message || 'Failed to release work order');
    }
  };

  const handleStatusChange = async (status: WorkOrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ workOrderId: id, status });
      alert('Status updated!');
      refetch();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleExportPDF = async () => {
    if (!workOrder) return;
    setExporting(true);
    try {
      const blob = await reportGenerator.generatePDF(workOrder as any);
      reportGenerator.downloadPDF(blob, `work-order-${workOrder.id}`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!workOrder) return;
    setExporting(true);
    try {
      const csv = await reportGenerator.generateCSV(workOrder as any);
      reportGenerator.downloadCSV(csv, `work-order-${workOrder.id}`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading work order...</div>;
  }

  if (!workOrder) {
    return <div className="p-8">Work order not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{workOrder.title}</h1>
              <p className="text-sm text-muted-foreground">
                Work Order #{workOrder.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/work-orders/${id}/steps`)}
              >
                📋 Manage Steps
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/work-orders')}
              >
                ← Back to List
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Details</CardTitle>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-sm rounded ${statusColors[workOrder.status]}`}>
                      {workOrder.status}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded ${priorityColors[workOrder.priority]}`}>
                      {workOrder.priority}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workOrder.description && (
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p className="text-muted-foreground">{workOrder.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Workflow</h3>
                    <p className="text-muted-foreground">{workOrder.workflow.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Created By</h3>
                    <p className="text-muted-foreground">{workOrder.createdBy.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Created</h3>
                    <p className="text-muted-foreground">
                      {new Date(workOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {workOrder.dueDate && (
                    <div>
                      <h3 className="font-semibold mb-1">Due Date</h3>
                      <p className="text-muted-foreground">
                        {new Date(workOrder.dueDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            {progress && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {progress.progress.completedSteps} of {progress.progress.totalSteps} steps completed
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(progress.progress.percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress.progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submissions */}
            {workOrder.submissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Submissions ({workOrder.submissions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workOrder.submissions.map((submission) => (
                      <div key={submission.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="font-medium">{submission.formTemplate.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Submitted by {submission.submitter.name} on{' '}
                          {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Assigned Team</h3>
                  {workOrder.assignedToTeam ? (
                    <div className="mb-2">
                      <p className="font-medium">{workOrder.assignedToTeam.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workOrder.assignedToTeam.members?.length || 0} members
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mb-2">Not assigned</p>
                  )}
                  
                  {/* Assign Team Dropdown (Supervisor only) */}
                  <select
                    onChange={(e) => e.target.value && handleAssign(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    defaultValue=""
                  >
                    <option value="">Assign to team...</option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Claimed By</h3>
                  {workOrder.claimedBy ? (
                    <div>
                      <p className="font-medium">{workOrder.claimedBy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workOrder.claimedBy.email}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUnclaim}
                        className="mt-2 w-full"
                      >
                        Release Claim
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground mb-2">Unclaimed</p>
                      <Button
                        size="sm"
                        onClick={handleClaim}
                        className="w-full"
                      >
                        Claim This Work
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Execute/Start Work Button */}
                {workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && (
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/operator/work-order/${id}`)}
                  >
                    🚀 {workOrder.status === 'PENDING' ? 'Start Work' : 'Continue Work'}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={workOrder.status === 'IN_PROGRESS'}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={workOrder.status === 'COMPLETED'}
                >
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={workOrder.status === 'CANCELLED'}
                >
                  Cancel Work Order
                </Button>
              </CardContent>
            </Card>

            {/* Export Card */}
            <Card>
              <CardHeader>
                <CardTitle>Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportPDF}
                  disabled={exporting}
                >
                  📄 Export as PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportCSV}
                  disabled={exporting}
                >
                  📊 Export as CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditing && (
        <EditWorkOrderDialog
          workOrder={workOrder}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function EditWorkOrderDialog({
  workOrder,
  onClose,
  onSuccess,
}: {
  workOrder: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: workOrder.title,
    description: workOrder.description || '',
    priority: workOrder.priority,
    dueDate: workOrder.dueDate ? new Date(workOrder.dueDate).toISOString().slice(0, 16) : '',
  });

  const updateMutation = trpc.workOrders.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: workOrder.id,
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority as any,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Edit Work Order</CardTitle>
          <CardDescription>Update work order details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2.5 border rounded-lg bg-background"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Due Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg bg-background"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isLoading}>
                {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

