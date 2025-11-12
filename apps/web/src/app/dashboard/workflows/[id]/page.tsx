'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@fieldform/ui';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  PlayCircle,
  PauseCircle,
  FileText,
  GitBranch,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
};

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const { data: workflow, isLoading } = trpc.workflows.getById.useQuery({ id });
  const { data: stats } = trpc.workflows.getStats.useQuery({ id });

  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/workflows');
    },
  });

  const duplicateMutation = trpc.workflows.duplicate.useMutation({
    onSuccess: (newWorkflow) => {
      router.push(`/dashboard/workflows/${newWorkflow.id}`);
    },
  });

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete workflow "${workflow?.name}"?`)) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error: any) {
        alert(error.message || 'Failed to delete workflow');
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateMutation.mutateAsync({ id });
    } catch (error: any) {
      alert(error.message || 'Failed to duplicate workflow');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading workflow...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Workflow not found</p>
            <p className="text-sm text-muted-foreground mb-4">
              The workflow you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/dashboard/workflows">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workflows
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const definition = workflow.definition as any;
  const steps = definition?.steps || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{workflow.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    workflow.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}
                >
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {workflow.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{workflow.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleDuplicate} className="gap-2">
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Link href="/dashboard/workflows">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  All Workflows
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Workflow Steps */}
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Workflow Steps ({steps.length})
                </CardTitle>
                <CardDescription>Step-by-step process definition</CardDescription>
              </CardHeader>
              <CardContent>
                {steps.length > 0 ? (
                  <div className="space-y-4">
                    {steps.map((step: any, index: number) => (
                      <div key={step.id || index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {index + 1}
                          </div>
                          {index < steps.length - 1 && (
                            <div className="w-0.5 h-12 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{step.name || `Step ${index + 1}`}</h4>
                            <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                              {step.type}
                            </span>
                          </div>
                          {step.description && (
                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No steps defined
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Work Orders */}
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  Recent Work Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workflow.workOrders && workflow.workOrders.length > 0 ? (
                  <div className="space-y-3">
                    {workflow.workOrders.map((workOrder) => {
                      const StatusIcon = statusIcons[workOrder.status];
                      return (
                        <Link
                          key={workOrder.id}
                          href={`/dashboard/work-orders/${workOrder.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{workOrder.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Created {new Date(workOrder.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[workOrder.status]
                              }`}
                            >
                              {workOrder.status.replace('_', ' ')}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No work orders created yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Statistics */}
            {stats && (
              <Card className="border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Work Orders</div>
                    <div className="text-2xl font-bold">{stats.totalWorkOrders}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Pending</div>
                      <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">In Progress</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {stats.inProgress}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Completed</div>
                      <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Cancelled</div>
                      <div className="text-lg font-semibold text-gray-600">{stats.cancelled}</div>
                    </div>
                  </div>
                  {stats.averageCompletionTime > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Avg. Completion Time
                      </div>
                      <div className="text-lg font-semibold">
                        {Math.round(stats.averageCompletionTime / (1000 * 60 * 60))} hours
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Workflow Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Created by</div>
                  <div className="font-medium">
                    {workflow.creator.name || workflow.creator.email}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Created</div>
                  <div className="font-medium">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Last Updated</div>
                  <div className="font-medium">
                    {new Date(workflow.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Steps</div>
                  <div className="font-medium">{steps.length}</div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/work-orders/new?workflowId=${workflow.id}`}>
                  <Button className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create Work Order
                  </Button>
                </Link>
                <Button variant="outline" className="w-full gap-2" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4" />
                  Duplicate Workflow
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

