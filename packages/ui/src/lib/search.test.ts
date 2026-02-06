import { describe, it, expect } from 'vitest';
import { SearchIndex } from './search';
import type { DocEntry } from '../store';

const docs: DocEntry[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    kind: 'function',
    fileName: 'src/alpha.ts',
    position: { line: 1, column: 0 },
    signature: 'function Alpha(): void',
    documentation: { summary: 'Alpha summary', tags: [] },
  },
  {
    id: 'beta',
    name: 'Beta',
    kind: 'class',
    fileName: 'src/beta.ts',
    position: { line: 1, column: 0 },
    signature: 'class Beta {}',
    documentation: { summary: 'Beta summary', tags: [] },
  },
];

describe('SearchIndex', () => {
  it('indexes and searches documents', () => {
    const index = new SearchIndex();
    index.addDocuments(docs);

    const results = index.search('Alpha');
    expect(results[0]?.name).toBe('Alpha');
  });

  it('searches by summary and kind', () => {
    const index = new SearchIndex();
    index.addDocuments(docs);

    const summaryResults = index.search('Beta');
    expect(summaryResults.some((r) => r.name === 'Beta')).toBe(true);

    const kindResults = index.search('class');
    expect(kindResults.some((r) => r.name === 'Beta')).toBe(true);
  });

  it('limits results and clears index', () => {
    const index = new SearchIndex();
    index.addDocuments(docs);

    const limited = index.search('a', 1);
    expect(limited).toHaveLength(1);

    index.clear();
    expect(index.search('Alpha')).toHaveLength(0);
  });
});
