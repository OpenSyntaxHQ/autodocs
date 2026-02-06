import React from 'react';
import { render, RenderResult, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../store';

type StoreState = ReturnType<typeof useStore.getState>;

type RenderOptions = {
  route?: string;
  initialState?: Partial<StoreState>;
};

const baseState: StoreState = useStore.getState();

export function resetStore(overrides: Partial<StoreState> = {}): void {
  useStore.setState({ ...baseState, ...overrides }, true);
}

export function renderWithRouter(
  ui: React.ReactElement,
  options: RenderOptions = {}
): RenderResult {
  const { route = '/' } = options;
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

export function renderWithStore(ui: React.ReactElement, options: RenderOptions = {}): RenderResult {
  resetStore(options.initialState);
  return renderWithRouter(ui, options);
}

export async function waitForLoadingToFinish(): Promise<void> {
  await waitFor(() => {
    expect(document.body.textContent).not.toContain('Loading');
  });
}
