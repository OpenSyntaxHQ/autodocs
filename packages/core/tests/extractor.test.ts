import path from 'path';
import { createProgram } from '../src/parser';
import { extractDocs } from '../src/extractor';

describe('Extractor', () => {
  it('should extract interface documentation', () => {
    const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
    const result = createProgram([fixturePath]);
    const docs = extractDocs(result.program);

    const userInterface = docs.find((d) => d.name === 'User');

    expect(userInterface).toBeDefined();
    expect(userInterface?.kind).toBe('interface');
    expect(userInterface?.members).toHaveLength(3);
  });

  it('should extract function documentation', () => {
    const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
    const result = createProgram([fixturePath]);
    const docs = extractDocs(result.program);

    const formatDateFn = docs.find((d) => d.name === 'formatDate');

    expect(formatDateFn).toBeDefined();
    expect(formatDateFn?.kind).toBe('function');
    expect(formatDateFn?.parameters).toHaveLength(1);
  });

  it('should capture JSDoc comments', () => {
    const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
    const result = createProgram([fixturePath]);
    const docs = extractDocs(result.program, { rootDir: path.join(__dirname, 'fixtures') });

    const userInterface = docs.find((d) => d.name === 'User');

    expect(userInterface?.documentation?.summary).toContain('user object');
  });

  it('should parse structured JSDoc tags', () => {
    const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
    const result = createProgram([fixturePath]);
    const docs = extractDocs(result.program, { rootDir: path.join(__dirname, 'fixtures') });

    const formatDateFn = docs.find((d) => d.name === 'formatDate');

    expect(formatDateFn?.documentation?.params?.[0]?.name).toBe('date');
    expect(formatDateFn?.documentation?.params?.[0]?.type).toBe('Date');
    expect(formatDateFn?.documentation?.returns).toContain('Formatted date string');
    expect(formatDateFn?.documentation?.deprecated).toContain('formatDateV2');
    expect(formatDateFn?.documentation?.examples?.[0]?.code).toContain('formatDate');
  });

  it('should extract enum members with values', () => {
    const fixturePath = path.join(__dirname, 'fixtures/exports.ts');
    const result = createProgram([fixturePath]);
    const docs = extractDocs(result.program, { rootDir: path.join(__dirname, 'fixtures') });

    const exportedEnum = docs.find((d) => d.name === 'ExportedEnum');

    expect(exportedEnum?.kind).toBe('enum');
    expect(exportedEnum?.members?.length).toBeGreaterThan(0);
    const alphaMember = exportedEnum?.members?.find((m) => m.name === 'Alpha');
    expect(alphaMember?.value).toBe('alpha');
  });
});
