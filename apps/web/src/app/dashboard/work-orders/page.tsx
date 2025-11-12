'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { WorkOrderStatus } from '@prisma/client';
import { Search, ClipboardList, AlertCircle } from 'lucide-react';
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

export default function WorkOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | undefined>();
  const [teamFilter, setTeamFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  const { data: workOrdersData, isLoading, error, isError, refetch } = trpc.workOrders.list.useQuery({
    status: statusFilter,
    teamId: teamFilter,
  });

  const workOrders = workOrdersData?.items || [];

  // Filter work orders based on search text
  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return [];

    return workOrders.filter(workOrder => {
      return searchText === '' ||
        workOrder.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (workOrder.description?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        workOrder.workflow.name.toLowerCase().includes(searchText.toLowerCase());
    });
  }, [workOrders, searchText]);

  const { data: teams } = trpc.teams.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-40 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-muted rounded animate-pulse" />
                <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-8 py-12">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-8">
                  <div className="h-10 w-16 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Filters Skeleton */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <div className="h-5 w-16 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-11 w-full bg-muted rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="h-5 w-16 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-11 w-full bg-muted rounded-lg animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="h-5 w-16 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-11 w-full bg-muted rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders List Skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-full bg-muted rounded animate-pulse mb-3" />
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-3" />
                      <div className="flex gap-4">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-9 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Work Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and assign work orders to teams
                </p>
              </div>
              <div className="flex gap-2">
                <ThemeToggle />
                <Link href="/dashboard">
                  <Button variant="outline">← Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-8 py-12 flex items-center justify-center">
          <Card className="max-w-xl w-full border-destructive/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-5 rounded-2xl bg-destructive/10 mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive mb-2">Failed to load work orders</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {error?.message || 'Unable to fetch work orders. Please try again.'}
              </p>
              <Button onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = {
    pending: filteredWorkOrders?.filter((wo) => wo.status === 'PENDING').length || 0,
    inProgress: filteredWorkOrders?.filter((wo) => wo.status === 'IN_PROGRESS').length || 0,
    completed: filteredWorkOrders?.filter((wo) => wo.status === 'COMPLETED').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Work Orders</h1>
              <p className="text-sm text-muted-foreground">
                Manage and assign work orders to teams
              </p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Link href="/dashboard/work-orders/new">
                <Button className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Create Work Order
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border">
            <CardHeader className="pb-8">
              <CardTitle className="text-4xl text-yellow-600 dark:text-yellow-400">{stats.pending}</CardTitle>
              <CardDescription className="text-base">Pending</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border">
            <CardHeader className="pb-8">
              <CardTitle className="text-4xl text-blue-600 dark:text-blue-400">{stats.inProgress}</CardTitle>
              <CardDescription className="text-base">In Progress</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border">
            <CardHeader className="pb-8">
              <CardTitle className="text-4xl text-green-600 dark:text-green-400">{stats.completed}</CardTitle>
              <CardDescription className="text-base">Completed</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-card/50 backdrop-blur-sm border">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by title, description, or workflow..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Status and Team Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={statusFilter || ''}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as WorkOrderStatus | undefined)
                    }
                    className="w-full h-11 px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Team</label>
                  <select
                    value={teamFilter || ''}
                    onChange={(e) => setTeamFilter(e.target.value || undefined)}
                    className="w-full h-11 px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Teams</option>
                    {teams?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results count */}
              {workOrders && workOrders.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Showing {filteredWorkOrders.length} of {workOrders.length} work order{workOrders.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Orders List */}
        {filteredWorkOrders && filteredWorkOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredWorkOrders.map((workOrder) => (
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
                        {workOrder.claimedBy && (
                          <div>
                            <span className="font-medium">Claimed by:</span>{' '}
                            {workOrder.claimedBy.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/work-orders/${workOrder.id}`}>
                        <Button variant="outline" size="sm" className="h-9">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workOrders && workOrders.length > 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-5 rounded-2xl bg-muted/30 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">No work orders match your search</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText('');
                  setStatusFilter(undefined);
                  setTeamFilter(undefined);
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-5 rounded-2xl bg-muted/30 mb-4">
                <ClipboardList className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">No work orders found</p>
              <p className="text-sm text-muted-foreground mb-6">
                Get started by creating your first work order
              </p>
              <Link href="/dashboard/work-orders/new">
                <Button className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Create Work Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

