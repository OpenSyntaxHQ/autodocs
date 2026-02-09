import { DocEntry, UiConfig } from '../store';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNCTION_COLOR_PATTERN = /^(?:rgb|hsl)a?\([^()]+\)$/i;
const CSS_VAR_PATTERN = /^var\(--[a-zA-Z0-9-_]+\)$/;
const SAFE_FONT_PATTERN = /^[a-zA-Z0-9\s'",-]+$/;
const SAFE_DATA_IMAGE_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/;

function sanitizeColor(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (HEX_COLOR_PATTERN.test(trimmed) || FUNCTION_COLOR_PATTERN.test(trimmed)) {
    return trimmed;
  }
  if (CSS_VAR_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function sanitizeFont(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return SAFE_FONT_PATTERN.test(trimmed) ? trimmed : undefined;
}

function sanitizeFavicon(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (SAFE_DATA_IMAGE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const resolved = new URL(trimmed, window.location.origin);
    if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

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
  const primaryColor = sanitizeColor(theme.primaryColor);
  const secondaryColor = sanitizeColor(theme.secondaryColor);
  const sansFont = sanitizeFont(theme.fonts?.sans);
  const monoFont = sanitizeFont(theme.fonts?.mono);
  const displayFont = sanitizeFont(theme.fonts?.display);
  const favicon = sanitizeFavicon(theme.favicon);

  if (primaryColor) {
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--ring', primaryColor);
    root.style.setProperty('--sidebar-primary', primaryColor);
    root.style.setProperty('--color-primary', primaryColor);
  }

  if (secondaryColor) {
    root.style.setProperty('--secondary', secondaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
  }

  if (sansFont) {
    root.style.setProperty('--font-sans', sansFont);
  }

  if (monoFont) {
    root.style.setProperty('--font-mono', monoFont);
  }

  if (displayFont) {
    root.style.setProperty('--font-display', displayFont);
  }

  if (favicon) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favicon;
  }
}
