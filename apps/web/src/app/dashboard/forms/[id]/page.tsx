'use client';

import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeShare } from '@/components/qr-code-share';
import { ThemeToggle } from '@/components/theme-toggle';
import { Eye, Edit3, ArrowLeft, QrCode, FileText, CheckCircle2 } from 'lucide-react';

export default function ViewFormPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const { data: template, isLoading } = trpc.forms.getTemplate.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-28 bg-muted rounded animate-pulse" />
                <div className="h-10 w-28 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 py-12 max-w-4xl">
          <div className="space-y-6">
            <Card className="border bg-card/50">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium mb-2">Form not found</p>
            <p className="text-sm text-muted-foreground mb-6">This form may have been deleted or moved</p>
            <Link href="/dashboard/forms">
              <Button>Back to Forms</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = (template.schema as any)?.sections || [];
  const formUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/forms/${id}/fill`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent truncate">
                {template.name}
              </h1>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/dashboard/forms">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <ThemeToggle />
              <QRCodeShare 
                url={formUrl}
                title={`Share: ${template.name}`}
                description="Scan or share this QR code to fill out this form"
              />
              <Link href={`/dashboard/forms/${id}/fill`}>
                <Button className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Fill Form
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12 max-w-4xl">
        {/* Form Details Card */}
        <Card className="mb-8 border bg-card/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Form Details</CardTitle>
                <CardDescription className="mt-1">Overview and configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex flex-col p-4 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground mb-1">Category</span>
                  <span className="font-medium">{template.category || 'Uncategorized'}</span>
                </div>
                <div className="flex flex-col p-4 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground mb-1">Version</span>
                  <span className="font-medium">v{template.version}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col p-4 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    {template.isPublished && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    <span className="font-medium">{template.isPublished ? 'Published' : 'Draft'}</span>
                  </div>
                </div>
                <div className="flex flex-col p-4 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground mb-1">Total Fields</span>
                  <span className="font-medium">
                    {sections.reduce((sum: number, s: any) => sum + (s.fields?.length || 0), 0)} fields in {sections.length} section{sections.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Structure */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Form Structure</h2>
            <span className="text-sm text-muted-foreground">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
          </div>
          
          {sections.map((section: any, sectionIndex: number) => (
            <Card key={section.id} className="border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Section {sectionIndex + 1}</span>
                    </div>
                    <CardTitle className="text-xl">{section.title || 'Untitled Section'}</CardTitle>
                    {section.description && (
                      <CardDescription className="mt-2">{section.description}</CardDescription>
                    )}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    {section.fields?.length || 0} field{section.fields?.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.fields && section.fields.length > 0 ? (
                  <div className="space-y-2">
                    {section.fields?.map((field: any, index: number) => (
                      <div
                        key={field.id || index}
                        className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-medium truncate">{field.label}</span>
                          {field.required && (
                            <span className="flex-shrink-0 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground px-3 py-1 bg-background/50 rounded-md">
                          {field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">No fields in this section</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

