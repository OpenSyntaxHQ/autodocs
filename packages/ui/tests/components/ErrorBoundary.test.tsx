import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThrowOnRender(): ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>healthy child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
