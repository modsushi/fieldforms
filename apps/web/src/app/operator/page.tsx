'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

export default function OperatorDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: workOrdersData, isLoading, refetch } = trpc.workOrders.list.useQuery({});
  const claimMutation = trpc.workOrders.claim.useMutation();

  const allWorkOrders = workOrdersData?.items || [];
  const claimedByMe = allWorkOrders?.filter((wo) => wo.claimedById === userId) || [];
  const availableToTeam =
    allWorkOrders?.filter((wo) => !wo.claimedById && wo.status === 'PENDING') || [];

  const handleClaim = async (workOrderId: string) => {
    try {
      await claimMutation.mutateAsync({ workOrderId });
      alert('Work order claimed!');
      refetch();
    } catch (error: any) {
      alert(error.message || 'Failed to claim work order');
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading your work...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">My Work</h1>
            <p className="text-sm text-muted-foreground">
              View and claim your assigned work orders
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* My Active Work */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">
            My Active Work ({claimedByMe.length})
          </h2>

          {claimedByMe.length > 0 ? (
            <div className="space-y-4">
              {claimedByMe.map((workOrder) => (
                <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{workOrder.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              statusColors[workOrder.status]
                            }`}
                          >
                            {workOrder.status}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              priorityColors[workOrder.priority]
                            }`}
                          >
                            {workOrder.priority}
                          </span>
                        </div>
                        {workOrder.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {workOrder.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Workflow:</span>{' '}
                            {workOrder.workflow.name}
                          </div>
                          {workOrder.assignedToTeam && (
                            <div>
                              <span className="font-medium">Team:</span>{' '}
                              {workOrder.assignedToTeam.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/operator/work-order/${workOrder.id}`}>
                          <Button>Work On This →</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                You haven't claimed any work orders yet. Check available work below.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Work */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Available to My Team ({availableToTeam.length})
          </h2>

          {availableToTeam.length > 0 ? (
            <div className="space-y-4">
              {availableToTeam.map((workOrder) => (
                <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{workOrder.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              priorityColors[workOrder.priority]
                            }`}
                          >
                            {workOrder.priority}
                          </span>
                        </div>
                        {workOrder.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {workOrder.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Workflow:</span>{' '}
                            {workOrder.workflow.name}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(workOrder.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleClaim(workOrder.id)}
                          disabled={claimMutation.isPending}
                        >
                          Claim
                        </Button>
                        <Link href={`/dashboard/work-orders/${workOrder.id}`}>
                          <Button variant="outline">View</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No available work orders for your team at the moment.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

