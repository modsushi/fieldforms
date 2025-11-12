'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@fieldform/ui';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Button } from '@fieldform/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { Database, Plus, ArrowLeft, MapPin, Package, Wrench, Pencil, Trash2, Search, Filter } from 'lucide-react';

export default function EntitiesPage() {
  const { data: entitiesData, isLoading, error, isError, refetch } = trpc.entities.getAll.useQuery({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [deletingEntity, setDeletingEntity] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const entities = entitiesData?.items || [];

  // Get unique entity types
  const entityTypes = useMemo(() => {
    if (!entities) return [];
    const types = entities.map(e => e.entityType);
    return ['all', ...Array.from(new Set(types))];
  }, [entities]);

  // Filter entities based on search and type
  const filteredEntities = useMemo(() => {
    if (!entities) return [];

    return entities.filter(entity => {
      const matchesSearch = searchText === '' ||
        entity.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (entity.code?.toLowerCase() || '').includes(searchText.toLowerCase());

      const matchesType = typeFilter === 'all' || entity.entityType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [entities, searchText, typeFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-28 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded animate-pulse" />
                <div className="h-9 w-36 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="container mx-auto px-8 py-12">
          {/* Search/Filter Skeleton */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="h-11 flex-1 bg-muted rounded-lg animate-pulse" />
            <div className="h-11 sm:w-64 bg-muted rounded-lg animate-pulse" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
                      <div className="flex-1">
                        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
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
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Entities
              </h1>
              <div className="flex items-center gap-3">
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

        <div className="container mx-auto px-8 py-12 flex items-center justify-center">
          <Card className="max-w-xl w-full border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <Database className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive mb-2">Failed to load entities</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {error?.message || 'Unable to fetch entities. Please try again.'}
              </p>
              <Button onClick={() => refetch()} className="gap-2">
                <Search className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Entities
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage sites, assets, and equipment
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <ThemeToggle />
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Entity
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        {showCreateForm && (
          <Card className="mb-8 border border-primary/30 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create New Entity</CardTitle>
                  <CardDescription className="mt-1">Add a new site, asset, or equipment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CreateEntityForm onClose={() => setShowCreateForm(false)} />
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Bar */}
        {entities && entities.length > 0 && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search entities by name or code..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Type Filter */}
              <div className="relative sm:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  {entityTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Info */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredEntities.length} of {entities.length} entit{entities.length !== 1 ? 'ies' : 'y'}
                {searchText && <span> matching "{searchText}"</span>}
                {typeFilter !== 'all' && <span> of type {typeFilter}</span>}
              </p>
            </div>
          </>
        )}

        {filteredEntities && filteredEntities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEntities.map((entity: any) => {
              const Icon = getEntityIcon(entity.entityType);
              return (
                <Card 
                  key={entity.id} 
                  className="hover:shadow-lg hover:scale-[1.02] transition-all border hover:border-primary/50 bg-card/50 backdrop-blur-sm group"
                >
                  <CardHeader className="pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {entity.name}
                        </CardTitle>
                        <CardDescription className="mt-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-muted/50 font-medium">
                            <Icon className="h-3.5 w-3.5" />
                            {entity.entityType}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {entity.properties && Object.keys(entity.properties as Record<string, any>).length > 0 ? (
                      <div className="text-sm space-y-2.5">
                        {Object.entries(entity.properties as Record<string, any>).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                            <span className="font-medium text-muted-foreground">{key}:</span>
                            <span className="text-foreground truncate ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No properties set</div>
                    )}
                    {entity.parentId && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Part of parent entity
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setEditingEntity(entity)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-destructive hover:text-destructive"
                        onClick={() => setDeletingEntity(entity)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : entities && entities.length > 0 ? (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                <Search className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-4 text-lg">No entities match your search</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText('');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                <Database className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-8 text-lg">No entities yet</p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create your first entity
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Entity Dialog */}
        {editingEntity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle>Edit Entity</CardTitle>
                <CardDescription>Update entity details</CardDescription>
              </CardHeader>
              <CardContent>
                <EditEntityForm
                  entity={editingEntity}
                  onClose={() => setEditingEntity(null)}
                  onSuccess={() => {
                    setEditingEntity(null);
                    refetch();
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deletingEntity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Delete Entity</CardTitle>
                <CardDescription>
                  Are you sure you want to delete "{deletingEntity.name}"? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteEntityConfirm
                  entity={deletingEntity}
                  onClose={() => setDeletingEntity(null)}
                  onSuccess={() => {
                    setDeletingEntity(null);
                    refetch();
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateEntityForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    entityType: 'site',
    properties: {},
  });

  const createEntity = trpc.entities.create.useMutation({
    onSuccess: () => {
      alert('Entity created!');
      onClose();
      window.location.reload();
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntity.mutate({
      name: formData.name,
      entityType: formData.entityType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="Enter entity name"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Type</label>
        <select
          value={formData.entityType}
          onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
          className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          <option value="site">🗺️ Site</option>
          <option value="asset">📦 Asset</option>
          <option value="equipment">🔧 Equipment</option>
          <option value="location">📍 Location</option>
          <option value="other">📋 Other</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createEntity.isLoading} className="gap-2">
          {createEntity.isLoading ? (
            <>Creating...</>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Entity
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function EditEntityForm({
  entity,
  onClose,
  onSuccess,
}: {
  entity: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: entity.name || '',
    code: entity.code || '',
  });

  const updateEntity = trpc.entities.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEntity.mutate({
      id: entity.id,
      name: formData.name,
      code: formData.code || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="Enter entity name"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Code (Optional)</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="QR/Barcode identifier"
        />
        <p className="text-xs text-muted-foreground">Used for QR code or barcode scanning</p>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Type:</strong> {entity.entityType}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Entity type cannot be changed after creation</p>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateEntity.isLoading} className="gap-2">
          {updateEntity.isLoading ? (
            <>Saving...</>
          ) : (
            <>
              <Pencil className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function DeleteEntityConfirm({
  entity,
  onClose,
  onSuccess,
}: {
  entity: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const deleteEntity = trpc.entities.delete.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert('Error: ' + error.message);
    },
  });

  const handleDelete = () => {
    deleteEntity.mutate({ id: entity.id });
  };

  return (
    <div className="space-y-6">
      <div className="bg-destructive/10 p-4 rounded-lg">
        <p className="text-sm">
          This will mark the entity as inactive. All related data will be preserved but the entity
          will no longer appear in listings.
        </p>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteEntity.isLoading}
          className="gap-2"
        >
          {deleteEntity.isLoading ? (
            <>Deleting...</>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete Entity
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

