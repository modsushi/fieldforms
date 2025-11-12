'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@fieldform/ui';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@fieldform/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  ArrowLeft, 
  CheckCircle, 
  MapPin, 
  Package, 
  Wrench, 
  Database,
  User,
  Calendar,
  FileText,
  X
} from 'lucide-react';

export default function FieldCreatedEntitiesPage() {
  const { data: entitiesData, isLoading, refetch } = trpc.entities.getAll.useQuery({});
  const [approvingEntity, setApprovingEntity] = useState<string | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<any>(null);

  const updateEntity = trpc.entities.update.useMutation({
    onSuccess: () => {
      refetch();
      setApprovingEntity(null);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
      setApprovingEntity(null);
    },
  });

  const deleteEntity = trpc.entities.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeletingEntity(null);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
      setDeletingEntity(null);
    },
  });

  const entities = entitiesData?.items || [];
  const fieldCreatedEntities = entities.filter((e: any) => e.tags?.includes('field-created'));

  const handleApprove = async (entityId: string, currentTags: string[]) => {
    setApprovingEntity(entityId);
    const newTags = currentTags.filter(tag => tag !== 'field-created');
    await updateEntity.mutateAsync({
      id: entityId,
      tags: newTags,
    });
  };

  const handleDelete = async (entityId: string) => {
    if (!confirm('Are you sure you want to delete this field-created entity? This action cannot be undone.')) {
      return;
    }
    await deleteEntity.mutateAsync({ id: entityId });
  };

  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'site':
      case 'location':
        return MapPin;
      case 'equipment':
        return Wrench;
      case 'asset':
        return Package;
      default:
        return Database;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Loading...</h1>
              <div className="flex items-center gap-3">
                <Link href="/dashboard/entities">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Entities
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 py-12 text-center">
          <p>Loading field-created entities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Field-Created Entities
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review and approve entities created from the field
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/entities">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Entities
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        {/* Summary Card */}
        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {fieldCreatedEntities.length} Pending Review
                </p>
                <p className="text-sm text-muted-foreground">
                  Entities created by field workers during work orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entity List */}
        {fieldCreatedEntities.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6 inline-block">
                <CheckCircle className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-lg text-muted-foreground mb-2">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                No field-created entities pending review
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {fieldCreatedEntities.map((entity: any) => {
              const Icon = getEntityIcon(entity.entityType);
              const metadata = entity.metadata || {};
              const createdByUserName = metadata.createdByUserName || 'Unknown User';
              const createdFromSubmission = metadata.createdFromSubmission;

              return (
                <Card key={entity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{entity.name}</CardTitle>
                            <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">
                              📍 Field Created
                            </span>
                          </div>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <span className="inline-flex items-center gap-1">
                                <Database className="h-3.5 w-3.5" />
                                {entity.entityType}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {createdByUserName}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(entity.createdAt)}
                              </span>
                            </div>
                            {entity.geometry && (
                              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                Location captured
                              </div>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(entity.id, entity.tags || [])}
                          disabled={approvingEntity === entity.id}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {approvingEntity === entity.id ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingEntity(entity)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {createdFromSubmission && (
                    <CardContent className="pt-0">
                      <div className="text-sm p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Created from form submission</span>
                          {createdFromSubmission && (
                            <Link 
                              href={`/dashboard/forms/submissions/${createdFromSubmission}`}
                              className="text-primary hover:underline ml-auto"
                            >
                              View Submission →
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingEntity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Delete Field-Created Entity</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{deletingEntity.name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 p-4 rounded-lg mb-4">
                <p className="text-sm">
                  This will permanently remove the entity and it cannot be recovered.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setDeletingEntity(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deletingEntity.id)}
                  disabled={deleteEntity.isPending}
                  className="gap-2"
                >
                  {deleteEntity.isPending ? 'Deleting...' : 'Delete Entity'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

