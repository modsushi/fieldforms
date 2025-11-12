'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  ArrowLeft,
  UserPlus,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const stepStatusColors = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Circle },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  SKIPPED: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
};

export default function WorkOrderStepsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [assigningStep, setAssigningStep] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const { data: stepsData, refetch } = trpc.workOrders.getSteps.useQuery({ workOrderId: id });
  const { data: users } = trpc.teams.getMembers.useQuery(
    { teamId: stepsData?.workOrder.assignedToTeamId || '' },
    { enabled: !!stepsData?.workOrder.assignedToTeamId }
  );

  const assignStepMutation = trpc.workOrders.assignStep.useMutation();
  const unassignStepMutation = trpc.workOrders.unassignStep.useMutation();

  const handleAssignStep = async (stepIndex: number) => {
    if (!selectedUserId) return;

    try {
      await assignStepMutation.mutateAsync({
        workOrderId: id,
        stepIndex,
        userId: selectedUserId,
      });
      setAssigningStep(null);
      setSelectedUserId('');
      refetch();
      alert('Step assigned successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to assign step');
    }
  };

  const handleUnassignStep = async (stepIndex: number) => {
    if (!confirm('Remove assignment from this step?')) return;

    try {
      await unassignStepMutation.mutateAsync({
        workOrderId: id,
        stepIndex,
      });
      refetch();
      alert('Assignment removed!');
    } catch (error: any) {
      alert(error.message || 'Failed to remove assignment');
    }
  };

  if (!stepsData) {
    return <div className="p-8">Loading steps...</div>;
  }

  const { workOrder, steps } = stepsData;
  const workflowSteps = (workOrder.workflow.definition as any)?.steps || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Work Order Steps
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {workOrder.title}
              </p>
            </div>
            <Link href={`/dashboard/work-orders/${id}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Work Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        <div className="space-y-6">
          {workflowSteps.map((stepDef: any, index: number) => {
            const stepRecord = steps.find((s) => s.stepIndex === index);
            const status = stepRecord?.status || 'PENDING';
            const StatusIcon = stepStatusColors[status].icon;

            return (
              <Card key={index} className="border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${stepStatusColors[status].bg}`}>
                        <StatusIcon className={`h-6 w-6 ${stepStatusColors[status].text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Step {index + 1}: {stepDef.name}
                        </CardTitle>
                        {stepDef.description && (
                          <CardDescription className="mt-1">
                            {stepDef.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span
                            className={`px-2 py-1 text-xs rounded ${stepStatusColors[status].bg} ${stepStatusColors[status].text}`}
                          >
                            {status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Type: {stepDef.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Assignment Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assignment
                    </h4>

                    {stepRecord?.assignedTo ? (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {stepRecord.assignedTo.name || stepRecord.assignedTo.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stepRecord.assignedTo.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignStep(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : assigningStep === index ? (
                      <div className="space-y-3">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">Select a user...</option>
                          {users?.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAssignStep(index)}
                            disabled={!selectedUserId || assignStepMutation.isPending}
                          >
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssigningStep(null);
                              setSelectedUserId('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssigningStep(index)}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign to User
                      </Button>
                    )}
                  </div>

                  {/* Completion Info */}
                  {stepRecord?.completedBy && stepRecord.completedAt && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3">Completion Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Completed by:</span>
                          <span className="font-medium">
                            {stepRecord.completedBy.name || stepRecord.completedBy.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Completed at:</span>
                          <span className="font-medium">
                            {format(new Date(stepRecord.completedAt), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        {stepRecord.startedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">
                              {Math.round(
                                (new Date(stepRecord.completedAt).getTime() -
                                  new Date(stepRecord.startedAt).getTime()) /
                                  1000 /
                                  60
                              )}{' '}
                              minutes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submissions */}
                  {stepRecord?.submissions && stepRecord.submissions.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Form Submissions ({stepRecord.submissions.length})
                      </h4>
                      <div className="space-y-2">
                        {stepRecord.submissions.map((submission) => (
                          <Link
                            key={submission.id}
                            href={`/dashboard/submissions/${submission.id}`}
                          >
                            <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {submission.formTemplate.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    By {submission.submitter.name || submission.submitter.email} •{' '}
                                    {format(new Date(submission.submittedAt), 'MMM d, HH:mm')}
                                  </p>
                                </div>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

