import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { OfflineIndicator } from '@/components/offline-indicator';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FieldForm - No-Code Field Form Builder',
  description: 'Flexible, offline-first field form solution for outdoor operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <OfflineIndicator />
        </Providers>
      </body>
    </html>
  );
}

