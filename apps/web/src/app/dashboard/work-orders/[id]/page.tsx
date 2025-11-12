'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import { WorkOrderStatus } from '@prisma/client';
import { reportGenerator } from '@/lib/reports/generator';
import { Edit, FileText, Download, Users, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const statusColors = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  CANCELLED: 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200',
};

const priorityColors = {
  LOW: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300',
  URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
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
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-muted rounded animate-pulse" />
                <div className="h-10 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 py-12">
          <div className="text-center text-muted-foreground">Loading work order...</div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Work Order Not Found</h1>
              </div>
              <div className="flex gap-2">
                <ThemeToggle />
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
        <div className="container mx-auto px-8 py-12 flex items-center justify-center">
          <Card className="max-w-xl w-full border-destructive/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-5 rounded-2xl bg-destructive/10 mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-lg font-semibold mb-2">Work order not found</p>
              <p className="text-sm text-muted-foreground mb-6">
                The work order you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push('/dashboard/work-orders')}>
                Back to Work Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{workOrder.title}</h1>
              <p className="text-sm text-muted-foreground">
                Work Order #{workOrder.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/work-orders/${id}/steps`)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Manage Steps
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
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

      <div className="container mx-auto px-8 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <Card className="border bg-card/50 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Details</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-md ${statusColors[workOrder.status]}`}>
                      {workOrder.status}
                    </span>
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-md ${priorityColors[workOrder.priority]}`}>
                      {workOrder.priority}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workOrder.description && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{workOrder.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-2">Workflow</h3>
                    <p className="text-muted-foreground">{workOrder.workflow.name}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-2">Created By</h3>
                    <p className="text-muted-foreground">{workOrder.createdBy.name}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-2">Created</h3>
                    <p className="text-muted-foreground">
                      {new Date(workOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {workOrder.dueDate && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <h3 className="font-semibold mb-2">Due Date</h3>
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
              <Card className="border bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">Progress</CardTitle>
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
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all"
                        style={{ width: `${progress.progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submissions */}
            {workOrder.submissions.length > 0 && (
              <Card className="border bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">Form Submissions ({workOrder.submissions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workOrder.submissions.map((submission) => (
                      <div key={submission.id} className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary">
                        <div className="font-medium">{submission.formTemplate.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
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
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Assignment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Assigned Team</h3>
                  {workOrder.assignedToTeam ? (
                    <div className="mb-3 p-3 rounded-lg bg-muted/30">
                      <p className="font-medium">{workOrder.assignedToTeam.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workOrder.assignedToTeam.members?.length || 0} members
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mb-3">Not assigned</p>
                  )}
                  
                  {/* Assign Team Dropdown (Supervisor only) */}
                  <select
                    onChange={(e) => e.target.value && handleAssign(e.target.value)}
                    className="w-full h-10 px-3 py-2 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                      <div className="mb-3 p-3 rounded-lg bg-muted/30">
                        <p className="font-medium">{workOrder.claimedBy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workOrder.claimedBy.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUnclaim}
                        className="w-full h-10"
                      >
                        Release Claim
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground mb-3">Unclaimed</p>
                      <Button
                        size="sm"
                        onClick={handleClaim}
                        className="w-full h-10"
                      >
                        Claim This Work
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Execute/Start Work Button */}
                {workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELLED' && (
                  <Button
                    className="w-full h-11 gap-2"
                    onClick={() => router.push(`/operator/work-order/${id}`)}
                  >
                    <FileText className="h-4 w-4" />
                    {workOrder.status === 'PENDING' ? 'Start Work' : 'Continue Work'}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={workOrder.status === 'IN_PROGRESS'}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={workOrder.status === 'COMPLETED'}
                >
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10 text-destructive hover:text-destructive"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={workOrder.status === 'CANCELLED'}
                >
                  Cancel Work Order
                </Button>
              </CardContent>
            </Card>

            {/* Export Card */}
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Export</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-10 gap-2"
                  onClick={handleExportPDF}
                  disabled={exporting}
                >
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10 gap-2"
                  onClick={handleExportCSV}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4" />
                  Export as CSV
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full border bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Edit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Edit Work Order</CardTitle>
              <CardDescription>Update work order details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full h-11 px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  className="w-full h-11 px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="h-11">
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isLoading} className="h-11">
                {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

