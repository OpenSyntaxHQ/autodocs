import crypto from 'crypto';
import type { AutodocsConfig } from '../config/types';

export function computeConfigHash(config: AutodocsConfig): string {
  const relevant = {
    tsconfig: config.tsconfig,
    compilerOptions: config.compilerOptions,
    include: config.include,
    exclude: config.exclude ?? [],
    plugins: normalizePlugins(config.plugins ?? []),
  };

  const payload = stableStringify(relevant);
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function normalizePlugins(
  plugins: Array<string | { name: string; options?: Record<string, unknown> }>
) {
  return plugins.map((plugin) => {
    if (typeof plugin === 'string') {
      return plugin;
    }
    return {
      name: plugin.name,
      options: plugin.options ?? {},
    };
  });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
