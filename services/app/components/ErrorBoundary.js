'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-red-500 hover:text-red-400"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 