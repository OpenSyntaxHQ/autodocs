import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '@/App';
import { resetStore } from './helpers';
import { useStore, DocEntry } from '@/store';

const loaders = vi.hoisted(() => ({
  loadDocs: vi.fn(),
  loadConfig: vi.fn(),
  applyTheme: vi.fn(),
}));

vi.mock('@/lib/loaders', () => loaders);

const sampleEntries: DocEntry[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    kind: 'function',
    fileName: 'src/alpha.ts',
    position: { line: 1, column: 0 },
    signature: 'function Alpha(): void',
  },
];

function resetDom() {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.cssText = '';
}

describe('App', () => {
  beforeEach(() => {
    resetStore({ docs: [], theme: 'dark' });
    vi.clearAllMocks();
    resetDom();
  });

  afterEach(() => {
    resetDom();
  });

  it('renders loading state while fetching', () => {
    const pending = new Promise(() => undefined);
    loaders.loadDocs.mockReturnValue(pending);
    loaders.loadConfig.mockReturnValue(pending);

    render(<App />);

    expect(screen.getByText('Loading documentation...')).toBeInTheDocument();
  });

  it('loads docs/config and applies theme', async () => {
    loaders.loadDocs.mockResolvedValue({ entries: sampleEntries });
    loaders.loadConfig.mockResolvedValue({
      features: { darkMode: false },
      theme: { primaryColor: '#123456' },
    });

    resetStore({ theme: 'dark' });
    render(<App />);

    await waitFor(() => {
      expect(useStore.getState().docs).toHaveLength(1);
    });

    expect(useStore.getState().config?.theme?.primaryColor).toBe('#123456');
    expect(loaders.applyTheme).toHaveBeenCalled();
    expect(useStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('shows error state when docs fail to load', async () => {
    loaders.loadDocs.mockRejectedValue(new Error('boom'));
    loaders.loadConfig.mockResolvedValue(null);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load docs')).toBeInTheDocument();
    });
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('does not overwrite existing docs', async () => {
    const existingDocs: DocEntry[] = [
      {
        id: 'existing',
        name: 'Existing',
        kind: 'function',
        fileName: 'src/existing.ts',
        position: { line: 1, column: 0 },
        signature: 'function Existing(): void',
      },
    ];

    loaders.loadDocs.mockResolvedValue({ entries: sampleEntries });
    loaders.loadConfig.mockResolvedValue(null);

    resetStore({ docs: existingDocs });
    render(<App />);

    await waitFor(() => {
      expect(useStore.getState().docs).toHaveLength(1);
    });

    expect(useStore.getState().docs[0]?.id).toBe('existing');
  });
});
