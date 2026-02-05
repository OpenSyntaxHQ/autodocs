import { computeConfigHash } from '../src/utils/configHash';

describe('computeConfigHash', () => {
  it('produces stable hashes for equivalent config', () => {
    const base = {
      include: ['src/**/*.ts'],
      output: { dir: './docs-dist', format: 'static' as const },
      theme: { name: 'default' },
      plugins: [
        { name: '@opensyntaxhq/autodocs-plugin-markdown', options: { sourceDir: './docs' } },
      ],
    };

    const hashA = computeConfigHash(base as import('../src/config').AutodocsConfig);
    const hashB = computeConfigHash(base as import('../src/config').AutodocsConfig);

    expect(hashA).toBe(hashB);
  });
});
