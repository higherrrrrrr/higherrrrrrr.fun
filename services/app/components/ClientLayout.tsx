'use client';

import { SolanaErrorBoundary } from './SolanaErrorBoundary';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <SolanaErrorBoundary>{children}</SolanaErrorBoundary>;
} 