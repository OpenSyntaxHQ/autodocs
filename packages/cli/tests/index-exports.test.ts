import { defineConfig } from '../src/index-exports';
import type { AutodocsConfig } from '../src/config';

describe('index-exports', () => {
  it('returns the config unchanged', () => {
    const config: AutodocsConfig = {
      include: ['src/**/*.ts'],
      output: { dir: './docs-dist', format: 'json', clean: true },
    } as AutodocsConfig;

    expect(defineConfig(config)).toBe(config);
  });
});
