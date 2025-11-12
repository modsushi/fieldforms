'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@fieldform/ui';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Forms error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Form Templates
            </h1>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-12 flex items-center justify-center">
        <Card className="max-w-xl w-full border-destructive/50">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Failed to load forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                {error.message || 'Unable to fetch form templates'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
