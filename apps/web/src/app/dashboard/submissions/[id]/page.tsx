'use client';

import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import {
  ArrowLeft,
  User,
  Clock,
  MapPin,
  FileText,
  Database,
  Smartphone,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: submission, isLoading, error } = trpc.forms.getSubmission.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium text-destructive mb-2">Submission not found</p>
              <p className="text-sm text-muted-foreground mb-4">
                The submission you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href="/dashboard/submissions">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse the form schema to get field definitions
  const formSchema = submission.formTemplate.schema as any;
  const sections = formSchema?.sections || [];

  // Helper to render field value based on type
  const renderFieldValue = (value: any, fieldType?: string) => {
    if (value === null || value === undefined || value === '') {
      return <span className="italic text-muted-foreground">No response</span>;
    }

    if (fieldType === 'checkbox' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <span className="italic text-muted-foreground">None selected</span>;
    }

    if (fieldType === 'file' || fieldType === 'photo') {
      if (typeof value === 'string') {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            View file
          </a>
        );
      }
      if (Array.isArray(value)) {
        return (
          <div className="space-y-1">
            {value.map((file, idx) => (
              <a
                key={idx}
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline"
              >
                File {idx + 1}
              </a>
            ))}
          </div>
        );
      }
    }

    if (fieldType === 'location' && typeof value === 'object') {
      return (
        <div className="text-sm">
          <div>Lat: {value.lat?.toFixed(6)}</div>
          <div>Lng: {value.lng?.toFixed(6)}</div>
        </div>
      );
    }

    if (typeof value === 'object') {
      return <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Submission Details
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {submission.formTemplate.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/submissions">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  All Submissions
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12">
        <div className="grid gap-6">
          {/* Metadata Card */}
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Submission Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Submitter */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    Submitted By
                  </div>
                  <div className="text-base">
                    {submission.submitter.name || submission.submitter.email}
                  </div>
                </div>

                {/* Submitted At */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Submitted At
                  </div>
                  <div className="text-base">
                    {format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                </div>

                {/* Entity */}
                {submission.entity && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Database className="h-4 w-4" />
                      Related Entity
                    </div>
                    <div className="text-base">
                      {submission.entity.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({submission.entity.entityType})
                      </span>
                    </div>
                  </div>
                )}

                {/* Work Order */}
                {submission.workOrder && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Briefcase className="h-4 w-4" />
                      Work Order
                    </div>
                    <Link href={`/dashboard/work-orders/${submission.workOrder.id}`}>
                      <div className="text-base text-primary hover:underline cursor-pointer">
                        {submission.workOrder.title}
                      </div>
                    </Link>
                  </div>
                )}

                {/* Device Info */}
                {submission.deviceInfo && Object.keys(submission.deviceInfo).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Smartphone className="h-4 w-4" />
                      Device
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(submission.deviceInfo as any).platform || 'Unknown platform'}
                    </div>
                  </div>
                )}

                {/* Location */}
                {submission.location && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission.location}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Responses Card */}
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Form Responses
              </CardTitle>
              {submission.formTemplate.description && (
                <CardDescription>{submission.formTemplate.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {sections.length > 0 ? (
                <div className="space-y-8">
                  {sections.map((section: any, sectionIdx: number) => (
                    <div key={section.id || sectionIdx}>
                      {/* Section Header */}
                      {section.title && (
                        <div className="mb-4 pb-2 border-b">
                          <h3 className="text-lg font-semibold">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fields */}
                      <div className="grid gap-4">
                        {section.fields?.map((field: any) => {
                          const fieldValue = (submission.data as any)[field.id];

                          return (
                            <div
                              key={field.id}
                              className="grid md:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="md:col-span-1">
                                <div className="font-medium">{field.label}</div>
                                {field.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {field.description}
                                  </div>
                                )}
                              </div>
                              <div className="md:col-span-2 flex items-center">
                                <div className="w-full">
                                  {renderFieldValue(fieldValue, field.type)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No form structure available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Data Card (for debugging/admin) */}
          <Card className="border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Raw Submission Data</CardTitle>
              <CardDescription>
                JSON representation of the submitted data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(submission.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

