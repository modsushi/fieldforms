'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { FileText, Eye, Edit3, ArrowLeft, Plus, Pencil, Search, Filter } from 'lucide-react';
import { Pagination } from '@/components/pagination';

const ITEMS_PER_PAGE = 12;

export default function FormsPage() {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error, isError, refetch } = trpc.forms.getTemplates.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const templates = data?.items;
  const totalCount = data?.total || 0;

  // Get unique categories
  const categories = useMemo(() => {
    if (!templates) return [];
    const cats = templates.map(t => t.category || 'Uncategorized');
    return ['all', ...Array.from(new Set(cats))];
  }, [templates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];

    return templates.filter(template => {
      const matchesSearch = searchText === '' ||
        template.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (template.description?.toLowerCase() || '').includes(searchText.toLowerCase());

      const matchesCategory = categoryFilter === 'all' ||
        (template.category || 'Uncategorized') === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchText, categoryFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-28 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded animate-pulse" />
                <div className="h-9 w-32 bg-muted rounded animate-pulse" />
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
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center mb-6 pb-4 border-t pt-4">
                    <div className="h-6 w-24 bg-muted rounded-lg animate-pulse" />
                    <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
                      <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-full bg-muted rounded animate-pulse" />
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
                Form Templates
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
                <FileText className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive mb-2">Failed to load forms</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {error?.message || 'Unable to fetch form templates. Please try again.'}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Form Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Create and manage your form templates
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
              <Link href="/dashboard/forms/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        {/* Search and Filter Bar */}
        {templates && templates.length > 0 && (
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search forms by name or description..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative sm:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Info */}
        {templates && templates.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTemplates.length} of {templates.length} form{templates.length !== 1 ? 's' : ''}
              {searchText && <span> matching "{searchText}"</span>}
              {categoryFilter !== 'all' && <span> in {categoryFilter}</span>}
            </p>
          </div>
        )}

        {filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="hover:shadow-lg hover:scale-[1.02] transition-all border hover:border-primary/50 bg-card/50 backdrop-blur-sm group"
              >
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-primary transition-colors text-xl">
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <CardDescription className="mt-2 text-sm">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-6 pb-4 border-t pt-4">
                    <span className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-medium">
                      {template.category || 'Uncategorized'}
                    </span>
                    <span className="text-xs">v{template.version}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/forms/${template.id}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2" size="sm">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/forms/${template.id}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2" size="sm">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                    <Link href={`/dashboard/forms/${template.id}/fill`} className="w-full">
                      <Button className="w-full gap-2" size="sm">
                        <Edit3 className="h-4 w-4" />
                        Fill Form
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                <Search className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-4 text-lg">No forms match your search</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText('');
                  setCategoryFilter('all');
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
                <FileText className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-8 text-lg">No form templates yet</p>
              <Link href="/dashboard/forms/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalCount > ITEMS_PER_PAGE && (
          <div className="mt-6">
            <Card className="border bg-card/50 backdrop-blur-sm">
              <Pagination
                currentPage={currentPage}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

