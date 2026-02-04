import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadDocs, applyTheme } from './loaders';
import { DocEntry } from '../store';

const sampleEntries: DocEntry[] = [
  {
    id: 'alpha',
    name: 'alpha',
    kind: 'function',
    fileName: 'src/alpha.ts',
    position: { line: 1, column: 0 },
    signature: 'function alpha(): void',
  },
];

describe('loadDocs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds fallback meta when missing', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ entries: sampleEntries }),
    } as Response);

    const payload = await loadDocs();

    expect(payload.meta?.version).toBe('0.0.0');
    expect(payload.meta?.stats?.total).toBe(1);
    expect(payload.entries).toHaveLength(1);
  });

  it('throws when entries are missing', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await expect(loadDocs()).rejects.toThrow('docs.json missing entries');
  });
});

describe('applyTheme', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.style.cssText = '';
  });

  it('applies css variables and favicon', () => {
    applyTheme({
      theme: {
        primaryColor: '#123456',
        secondaryColor: '#654321',
        fonts: { sans: 'Inter', mono: 'JetBrains Mono', display: 'Space Grotesk' },
        favicon: '/favicon.svg',
      },
    });

    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#123456');
    expect(document.documentElement.style.getPropertyValue('--secondary')).toBe('#654321');
    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe('Inter');
    expect(document.documentElement.style.getPropertyValue('--font-mono')).toBe('JetBrains Mono');
    expect(document.documentElement.style.getPropertyValue('--font-display')).toBe('Space Grotesk');

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(link).not.toBeNull();
    expect(link?.href).toContain('/favicon.svg');
  });
});
