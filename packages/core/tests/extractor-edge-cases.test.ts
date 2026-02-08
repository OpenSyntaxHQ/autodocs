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

  it('builds stable heritage ids for multiple symbol shapes', async () => {
    const tempDir = await createTempDir('autodocs-extractor-');
    const entryPath = await writeTempFile(
      tempDir,
      'src/heritage.ts',
      `
        export interface InterfaceBase {
          value: string;
        }
        export type TypeBase = {
          count: number;
        };
        export class ClassBase {}
        export const VariableBase = class {};
        export function FunctionBase(this: unknown) {}
        export enum EnumBase {
          Alpha = 'alpha'
        }

        export interface InterfaceChild extends InterfaceBase {}
        export interface TypeChild extends TypeBase {}
        export interface UnknownChild extends MissingBase {}

        export class ClassChild extends ClassBase {}
        export class VariableChild extends VariableBase {}
        export class FunctionChild extends (FunctionBase as unknown as { new (): unknown }) {}
        export class EnumChild extends (EnumBase as unknown as { new (): unknown }) {}
      `
    );

    const result = createProgram([entryPath]);
    const docs = extractDocs(result.program, { rootDir: tempDir });

    const interfaceChild = docs.find((d) => d.name === 'InterfaceChild');
    const typeChild = docs.find((d) => d.name === 'TypeChild');
    const unknownChild = docs.find((d) => d.name === 'UnknownChild');
    const classChild = docs.find((d) => d.name === 'ClassChild');
    const variableChild = docs.find((d) => d.name === 'VariableChild');
    const functionChild = docs.find((d) => d.name === 'FunctionChild');
    const enumChild = docs.find((d) => d.name === 'EnumChild');

    expect(interfaceChild?.heritage?.[0]).toMatchObject({ name: 'InterfaceBase', kind: 'extends' });
    expect(typeChild?.heritage?.[0]).toMatchObject({ kind: 'extends' });
    expect(typeChild?.heritage?.[0]?.name).toBeTruthy();
    expect(unknownChild?.heritage?.[0]).toMatchObject({ name: 'unknown', kind: 'extends' });
    expect(classChild?.heritage?.[0]).toMatchObject({ kind: 'extends' });
    expect(variableChild?.heritage?.[0]).toMatchObject({ kind: 'extends' });
    expect(functionChild?.heritage?.[0]).toMatchObject({ kind: 'extends' });
    expect(enumChild?.heritage?.[0]).toMatchObject({ kind: 'extends' });
    expect(classChild?.heritage?.[0]?.name).toBeTruthy();
    expect(variableChild?.heritage?.[0]?.name).toBeTruthy();
    expect(functionChild?.heritage?.[0]?.name).toBeTruthy();
    expect(enumChild?.heritage?.[0]?.name).toBeTruthy();

    for (const entry of [
      interfaceChild,
      typeChild,
      unknownChild,
      classChild,
      variableChild,
      functionChild,
      enumChild,
    ]) {
      expect(entry?.heritage?.[0]?.id).toMatch(/^[0-9a-f]{8}$/);
    }
  });
});
