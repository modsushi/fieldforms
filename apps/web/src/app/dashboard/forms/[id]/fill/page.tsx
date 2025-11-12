'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { FormRenderer } from '@/components/form-renderer';
import { Card, CardContent, Button } from '@fieldform/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { ArrowLeft, FileText, Send } from 'lucide-react';

export default function FillFormPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const { data: template, isLoading } = trpc.forms.getTemplate.useQuery({ id });
  const submitMutation = trpc.forms.submitForm.useMutation();

  const handleSubmit = async (data: any) => {
    try {
      await submitMutation.mutateAsync({
        formTemplateId: id,
        data,
        location: undefined,
        deviceInfo: {
          deviceId: 'web-browser',
          platform: 'web',
          osVersion: navigator.userAgent,
          appVersion: '1.0.0',
        },
      });
      
      alert('Form submitted successfully!');
      router.push('/dashboard/forms');
    } catch (error) {
      console.error('Failed to submit form:', error);
      alert('Failed to submit form. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-8 py-12 max-w-4xl">
          <Card className="border bg-card/50">
            <CardContent className="p-8 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-11 w-full bg-muted rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
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
            <div className="flex items-center gap-3">
              <Link href="/dashboard/forms">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-12 max-w-4xl">
        <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Ready to fill out this form</p>
              <p className="text-xs text-muted-foreground mt-0.5">All required fields must be completed before submission</p>
            </div>
          </div>
        </div>

        <FormRenderer
          template={template as any}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
        />
      </div>
    </div>
  );
}

