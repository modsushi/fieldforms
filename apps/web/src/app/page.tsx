import Link from 'next/link';
import { Button } from '@fieldform/ui';
import { ArrowRight, Sparkles, Wifi, Layout } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="container mx-auto px-8 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          FieldForm
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-8 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-10">
            <Sparkles className="h-4 w-4" />
            Offline-First Field Form Builder
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Create Beautiful Forms
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Work Anywhere
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
            Build powerful, offline-capable forms with our intuitive no-code builder.
            Perfect for field operations, site inspections, and data collection anywhere.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                Start Building Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-28 max-w-6xl mx-auto">
          <div className="group p-10 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Layout className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">No-Code Builder</h3>
            <p className="text-muted-foreground leading-relaxed">
              Create complex forms with our intuitive drag-and-drop interface. 
              No coding required, just point and click.
            </p>
          </div>

          <div className="group p-10 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Wifi className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Offline-First</h3>
            <p className="text-muted-foreground leading-relaxed">
              Work seamlessly without internet. Data syncs automatically 
              when you're back online.
            </p>
          </div>

          <div className="group p-10 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Smart Workflows</h3>
            <p className="text-muted-foreground leading-relaxed">
              Multi-step processes with conditional logic and automated 
              actions for streamlined operations.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-28 text-center">
          <div className="inline-block p-14 rounded-3xl bg-card/50 backdrop-blur-sm border shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6 text-lg">
              Join teams using FieldForm to streamline their field operations
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                Create Your First Form
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-8 py-10 mt-24 border-t">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>© 2025 FieldForm. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}


