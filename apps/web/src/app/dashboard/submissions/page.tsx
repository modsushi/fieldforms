'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';
import { Send, ArrowLeft, Eye, FileText, User, Clock, Search } from 'lucide-react';
import { Pagination } from '@/components/pagination';

const ITEMS_PER_PAGE = 20;

export default function SubmissionsPage() {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error, isError, refetch } = trpc.forms.getSubmissions.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const submissions = data?.items;
  const totalCount = data?.total || 0;

  // Filter submissions based on search
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];

    return submissions.filter(submission => {
      const formName = submission.formTemplate?.name || '';
      const submitterName = submission.submitter?.name || submission.submitter?.email || '';
      const entityName = submission.entity?.name || '';

      return searchText === '' ||
        formName.toLowerCase().includes(searchText.toLowerCase()) ||
        submitterName.toLowerCase().includes(searchText.toLowerCase()) ||
        entityName.toLowerCase().includes(searchText.toLowerCase());
    });
  }, [submissions, searchText]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-56 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-72 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-28 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="container mx-auto px-8 py-12">
          {/* Search Skeleton */}
          <div className="mb-8">
            <div className="h-11 w-full bg-muted rounded-lg animate-pulse" />
          </div>

          {/* Table Skeleton */}
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium">
                      <th className="p-4">
                        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      </th>
                      <th className="p-4">
                        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                      </th>
                      <th className="p-4">
                        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                      </th>
                      <th className="p-4">
                        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                      </th>
                      <th className="p-4">
                        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(8)].map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-5">
                          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                        </td>
                        <td className="p-5">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        </td>
                        <td className="p-5">
                          <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                        </td>
                        <td className="p-5">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        </td>
                        <td className="p-5">
                          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
                Form Submissions
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
                <Send className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive mb-2">Failed to load submissions</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {error?.message || 'Unable to fetch form submissions. Please try again.'}
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
                Form Submissions
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                View and manage all submitted forms
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        {/* Search Bar */}
        {submissions && submissions.length > 0 && (
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search submissions by form, submitter, or entity..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            {searchText && (
              <p className="text-sm text-muted-foreground mt-3">
                Showing {filteredSubmissions.length} of {submissions.length} submission{submissions.length !== 1 ? 's' : ''} matching "{searchText}"
              </p>
            )}
          </div>
        )}

        {filteredSubmissions && filteredSubmissions.length > 0 ? (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">All Submissions ({filteredSubmissions.length})</CardTitle>
                  <CardDescription className="mt-1">Recent form submissions from your team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium">
                      <th className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Form
                        </div>
                      </th>
                      <th className="p-4">Entity</th>
                      <th className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Submitted By
                        </div>
                      </th>
                      <th className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Submitted At
                        </div>
                      </th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr 
                        key={submission.id} 
                        className="border-b hover:bg-muted/40 transition-colors group"
                      >
                        <td className="p-5">
                          <div className="font-medium group-hover:text-primary transition-colors">
                            {submission.formTemplate?.name || 'Unknown Form'}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="text-sm text-muted-foreground">
                            {submission.entity?.name || (
                              <span className="italic">No entity</span>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="text-sm">
                            {submission.submitter?.name || submission.submitter?.email}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </td>
                        <td className="p-5">
                          <Link href={`/dashboard/submissions/${submission.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : submissions && submissions.length > 0 ? (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                <Search className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-4 text-lg">No submissions match your search</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try adjusting your search criteria
              </p>
              <Button variant="outline" onClick={() => setSearchText('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-5 rounded-2xl bg-muted/30 mb-6">
                <Send className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground mb-3 text-lg">No submissions yet</p>
              <p className="text-sm text-muted-foreground mb-8">
                Fill out a form to create your first submission
              </p>
              <Link href="/dashboard/forms">
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Browse Forms
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalCount > ITEMS_PER_PAGE && (
          <div className="mt-8">
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

