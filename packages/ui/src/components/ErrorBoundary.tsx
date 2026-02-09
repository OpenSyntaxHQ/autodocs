import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen items-center justify-center px-6 text-center">
            <div className="max-w-md space-y-3">
              <h1 className="text-2xl font-semibold">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                Refresh the page or rebuild docs if this persists.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
