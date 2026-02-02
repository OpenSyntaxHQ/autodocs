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
    const docs = extractDocs(result.program);

    const userInterface = docs.find((d) => d.name === 'User');

    expect(userInterface?.documentation?.summary).toContain('user object');
  });
});
