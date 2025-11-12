'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ClipboardList, Briefcase, ArrowRight } from 'lucide-react';
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
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="text-center text-muted-foreground">Loading your work...</div>
          </div>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">My Work</h1>
              <p className="text-sm text-muted-foreground">
                View and claim your assigned work orders
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-12">
        {/* My Active Work */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">
              My Active Work ({claimedByMe.length})
            </h2>
          </div>

          {claimedByMe.length > 0 ? (
            <div className="space-y-4">
              {claimedByMe.map((workOrder) => (
                <Card key={workOrder.id} className="bg-card/50 backdrop-blur-sm border hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{workOrder.title}</h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-md ${
                              statusColors[workOrder.status]
                            }`}
                          >
                            {workOrder.status}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-md ${
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
                          <Button className="gap-2 h-10">
                            Work On This
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border">
              <CardContent className="py-12 text-center">
                <div className="p-5 rounded-2xl bg-muted/30 mb-4 inline-block">
                  <Briefcase className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">No Active Work</p>
                <p className="text-sm text-muted-foreground">
                  You haven't claimed any work orders yet. Check available work below.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Work */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">
              Available to My Team ({availableToTeam.length})
            </h2>
          </div>

          {availableToTeam.length > 0 ? (
            <div className="space-y-4">
              {availableToTeam.map((workOrder) => (
                <Card key={workOrder.id} className="bg-card/50 backdrop-blur-sm border hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{workOrder.title}</h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-md ${
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
                          className="h-10"
                        >
                          Claim
                        </Button>
                        <Link href={`/dashboard/work-orders/${workOrder.id}`}>
                          <Button variant="outline" className="h-10">View</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border">
              <CardContent className="py-12 text-center">
                <div className="p-5 rounded-2xl bg-muted/30 mb-4 inline-block">
                  <ClipboardList className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">No Available Work</p>
                <p className="text-sm text-muted-foreground">
                  No available work orders for your team at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

