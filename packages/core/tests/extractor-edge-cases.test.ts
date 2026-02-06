import { createProgram } from '../src/parser';
import { extractDocs } from '../src/extractor';
import { createTempDir, writeTempFile } from './helpers/fixtures';

describe('Extractor Edge Cases', () => {
  it('extracts complex generic and mapped types', async () => {
    const tempDir = await createTempDir('autodocs-extractor-');
    const entryPath = await writeTempFile(
      tempDir,
      'src/types.ts',
      `
        export type Maybe<T> = T | null;
        export type Mapped<T> = { [K in keyof T]?: T[K] };
        export interface Box<T extends { id: string } = { id: string }> {
          value: T;
        }
      `
    );

    const result = createProgram([entryPath]);
    const docs = extractDocs(result.program, { rootDir: tempDir });

    expect(docs.find((d) => d.name === 'Maybe')?.kind).toBe('type');
    expect(docs.find((d) => d.name === 'Mapped')?.kind).toBe('type');
    const box = docs.find((d) => d.name === 'Box');
    expect(box?.kind).toBe('interface');
    expect(box?.typeParameters?.length).toBeGreaterThan(0);
  });

  it('extracts classes with modifiers and members', async () => {
    const tempDir = await createTempDir('autodocs-extractor-');
    const entryPath = await writeTempFile(
      tempDir,
      'src/class.ts',
      `
        export abstract class Base {
          protected id = 1;
          static version = '1.0';
          get name(): string { return 'name'; }
          greet(): string { return 'hi'; }
        }
      `
    );

    const result = createProgram([entryPath]);
    const docs = extractDocs(result.program, { rootDir: tempDir });
    const base = docs.find((d) => d.name === 'Base');

    expect(base?.kind).toBe('class');
    expect(base?.members?.length).toBeGreaterThan(0);
  });

  it('handles computed property names and symbols', async () => {
    const tempDir = await createTempDir('autodocs-extractor-');
    const entryPath = await writeTempFile(
      tempDir,
      'src/computed.ts',
      `
        const symbolKey = Symbol('key');
        export interface WithComputed {
          [symbolKey]: string;
          ['computed' + 'Name']?: number;
        }
      `
    );

    const result = createProgram([entryPath]);
    const docs = extractDocs(result.program, { rootDir: tempDir });
    const entry = docs.find((d) => d.name === 'WithComputed');

    expect(entry?.kind).toBe('interface');
    expect(entry?.members?.length).toBeGreaterThan(0);
  });
});
