import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore } from '@/store';

function resetState() {
  useStore.setState({
    theme: 'light',
    sidebarOpen: true,
    searchQuery: '',
    searchOpen: false,
    docs: [],
    config: null,
    currentEntry: null,
  });
}

describe('store', () => {
  beforeEach(() => {
    resetState();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('toggles theme', () => {
    useStore.getState().toggleTheme();
    expect(useStore.getState().theme).toBe('dark');
    useStore.getState().toggleTheme();
    expect(useStore.getState().theme).toBe('light');
  });

  it('sets theme and updates document class', () => {
    useStore.getState().setTheme('dark');
    expect(useStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    useStore.getState().setTheme('light');
    expect(useStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('manages sidebar and search state', () => {
    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarOpen).toBe(false);

    useStore.getState().setSearchQuery('alpha');
    expect(useStore.getState().searchQuery).toBe('alpha');

    useStore.getState().toggleSearch();
    expect(useStore.getState().searchOpen).toBe(true);
  });

  it('stores docs and config', () => {
    useStore.getState().setDocs([
      {
        id: 'alpha',
        name: 'Alpha',
        kind: 'function',
        fileName: 'src/alpha.ts',
        position: { line: 1, column: 0 },
        signature: 'function Alpha(): void',
      },
    ]);
    expect(useStore.getState().docs).toHaveLength(1);

    useStore.getState().setConfig({ theme: { name: 'default' } });
    expect(useStore.getState().config?.theme?.name).toBe('default');
  });

  it('stores the current entry', () => {
    useStore.getState().setCurrentEntry({
      id: 'alpha',
      name: 'Alpha',
      kind: 'function',
      fileName: 'src/alpha.ts',
      position: { line: 1, column: 0 },
      signature: 'function Alpha(): void',
    });

    expect(useStore.getState().currentEntry?.id).toBe('alpha');
  });
});
