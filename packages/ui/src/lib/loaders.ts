import { DocEntry, UiConfig } from '../store';

export interface DocsPayload {
  meta?: {
    version?: string;
    generatedAt?: string;
    rootDir?: string;
    stats?: {
      total: number;
      byKind: Record<string, number>;
      byModule: Record<string, number>;
    };
  };
  entries: DocEntry[];
}

export async function loadDocs(): Promise<DocsPayload> {
  const response = await fetch('/docs.json');
  if (!response.ok) {
    throw new Error(`Failed to load docs.json (${String(response.status)})`);
  }

  const data = (await response.json()) as Partial<DocsPayload> & { entries?: DocEntry[] };

  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('docs.json missing entries');
  }

  if (!data.meta) {
    return {
      meta: {
        version: '0.0.0',
        generatedAt: new Date().toISOString(),
        stats: {
          total: data.entries.length,
          byKind: {},
          byModule: {},
        },
      },
      entries: data.entries,
    };
  }

  return {
    meta: data.meta,
    entries: data.entries,
  };
}

export async function loadConfig(): Promise<UiConfig | null> {
  const response = await fetch('/config.json');
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as UiConfig;
  return data;
}

export function applyTheme(config: UiConfig | null): void {
  if (!config?.theme) {
    return;
  }

  const root = document.documentElement;
  const theme = config.theme;

  if (theme.primaryColor) {
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--ring', theme.primaryColor);
    root.style.setProperty('--sidebar-primary', theme.primaryColor);
    root.style.setProperty('--color-primary', theme.primaryColor);
  }

  if (theme.secondaryColor) {
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
  }

  if (theme.fonts?.sans) {
    root.style.setProperty('--font-sans', theme.fonts.sans);
  }

  if (theme.fonts?.mono) {
    root.style.setProperty('--font-mono', theme.fonts.mono);
  }

  if (theme.fonts?.display) {
    root.style.setProperty('--font-display', theme.fonts.display);
  }

  if (theme.favicon) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = theme.favicon;
  }
}
