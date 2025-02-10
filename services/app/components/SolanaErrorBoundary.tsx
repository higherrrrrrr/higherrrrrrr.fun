'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SolanaErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Solana error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
          <h2 className="text-red-500 font-bold mb-2">Something went wrong</h2>
          <p className="text-red-500/70">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
} 