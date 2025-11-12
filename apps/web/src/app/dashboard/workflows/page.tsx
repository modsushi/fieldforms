'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  Plus,
  GitBranch,
  PlayCircle,
  PauseCircle,
  Copy,
  Trash2,
  FileText,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function WorkflowsPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: workflows, isLoading, refetch } = trpc.workflows.list.useQuery({
    isActive: filter === 'all' ? undefined : filter === 'active',
  });

  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const duplicateMutation = trpc.workflows.duplicate.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete workflow "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error: any) {
        alert(error.message || 'Failed to delete workflow');
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync({ id });
    } catch (error: any) {
      alert(error.message || 'Failed to duplicate workflow');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading workflows...</div>
      </div>
    );
  }

  const activeWorkflows = workflows?.filter((w) => w.isActive) || [];
  const inactiveWorkflows = workflows?.filter((w) => !w.isActive) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Workflows
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage multi-step workflows for work orders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/workflows/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Workflow
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              filter === 'all' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setFilter('all')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold">{workflows?.length || 0}</CardTitle>
                  <CardDescription className="mt-1">Total Workflows</CardDescription>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <GitBranch className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              filter === 'active' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setFilter('active')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-green-600">
                    {activeWorkflows.length}
                  </CardTitle>
                  <CardDescription className="mt-1">Active</CardDescription>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <PlayCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              filter === 'inactive' ? 'ring-2 ring-gray-500' : ''
            }`}
            onClick={() => setFilter('inactive')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-600">
                    {inactiveWorkflows.length}
                  </CardTitle>
                  <CardDescription className="mt-1">Inactive</CardDescription>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900/20">
                  <PauseCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Workflows List */}
        {workflows && workflows.length > 0 ? (
          <div className="grid gap-6">
            {workflows.map((workflow) => {
              const definition = workflow.definition as any;
              const stepCount = definition?.steps?.length || 0;

              return (
                <Card key={workflow.id} className="border bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{workflow.name}</CardTitle>
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
                          <CardDescription className="mt-2">{workflow.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                          </div>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            {workflow._count.workOrders} work{' '}
                            {workflow._count.workOrders === 1 ? 'order' : 'orders'}
                          </div>
                          <div>Created by {workflow.creator.name || workflow.creator.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/workflows/${workflow.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(workflow.id)}
                          disabled={duplicateMutation.isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(workflow.id, workflow.name)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                <GitBranch className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-3 text-lg">No workflows yet</p>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Create your first workflow to define multi-step processes for your field work
              </p>
              <Link href="/dashboard/workflows/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Workflow
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

