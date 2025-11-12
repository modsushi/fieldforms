'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { FileText, Database, Send, LogOut, Briefcase, Users, GitBranch } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {data: formsData, isLoading: formsLoading} = trpc.forms.getTemplates.useQuery({});
  const {data: entitiesData, isLoading: entitiesLoading} = trpc.entities.getAll.useQuery({});
  const {data: workOrdersData} = trpc.workOrders.list.useQuery({});
  const {data: teams} = trpc.teams.list.useQuery();

  const forms = formsData?.items || [];
  const entities = entitiesData?.items || [];
  const workOrders = workOrdersData?.items || [];
  const {data: workflows} = trpc.workflows.list.useQuery();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                FieldForm
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome back, {session.user.name || session.user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground px-3 py-1.5 rounded-md bg-secondary/50">
                {(session.user as any).orgName}
              </div>
              <Link href="/dashboard/forms">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Forms
                </Button>
              </Link>
              <Link href="/dashboard/submissions">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Send className="h-4 w-4" />
                  Submissions
                </Button>
              </Link>
              <Link href="/dashboard/entities">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Database className="h-4 w-4" />
                  Entities
                </Button>
              </Link>
              <Link href="/dashboard/work-orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Work Orders
                </Button>
              </Link>
              {(session.user as any).role === 'SUPERVISOR' && (
                <>
                  <Link href="/dashboard/workflows">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <GitBranch className="h-4 w-4" />
                      Workflows
                    </Button>
                  </Link>
                  <Link href="/dashboard/teams">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Users className="h-4 w-4" />
                      Teams
                    </Button>
                  </Link>
                </>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <Link href="/dashboard/forms">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border hover:border-primary/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-bold">{forms?.length || 0}</CardTitle>
                    <CardDescription className="mt-2 text-base">Form Templates</CardDescription>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/entities">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border hover:border-primary/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-bold">{entities?.length || 0}</CardTitle>
                    <CardDescription className="mt-2 text-base">Entities</CardDescription>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/submissions">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border hover:border-primary/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-bold">0</CardTitle>
                    <CardDescription className="mt-2 text-base">Submissions Today</CardDescription>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Send className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/work-orders">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border hover:border-primary/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-bold">{workOrders?.length || 0}</CardTitle>
                    <CardDescription className="mt-2 text-base">Work Orders</CardDescription>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          {(session.user as any).role === 'SUPERVISOR' && (
            <>
              <Link href="/dashboard/workflows">
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border hover:border-primary/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-4xl font-bold">{workflows?.length || 0}</CardTitle>
                        <CardDescription className="mt-2 text-base">Workflows</CardDescription>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10">
                        <GitBranch className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/teams">
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border hover:border-primary/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-4xl font-bold">{teams?.length || 0}</CardTitle>
                        <CardDescription className="mt-2 text-base">Teams</CardDescription>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Form Templates</CardTitle>
                  <CardDescription className="mt-1">Your latest form templates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {formsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : forms && forms.length > 0 ? (
                <div className="space-y-3">
                  {forms.slice(0, 5).map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border"
                    >
                      <div>
                        <div className="font-medium text-base">{form.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {form.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No form templates yet. Create your first one to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Entities</CardTitle>
                  <CardDescription className="mt-1">Recently added entities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {entitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : entities && entities.length > 0 ? (
                <div className="space-y-3">
                  {entities.slice(0, 5).map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border"
                    >
                      <div>
                        <div className="font-medium text-base">{entity.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {entity.entityType}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                    <Database className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No entities yet. Add your first site or asset to begin!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

