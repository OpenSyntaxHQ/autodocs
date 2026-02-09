import { describe, expect, it } from 'vitest';
import { docPath } from '@/lib/routes';

describe('docPath', () => {
  it('builds clean guide URLs with stable short IDs', () => {
    const path = docPath({
      kind: 'guide',
      id: 'a1b2c3d4',
      name: 'Intro',
    });

    expect(path).toBe('/guide/a1b2c3d4/intro');
  });
});
