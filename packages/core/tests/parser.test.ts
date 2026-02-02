import path from 'path';
import { createProgram } from '../src/parser';

describe('Parser', () => {
  it('should create a TypeScript program', () => {
    const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
    const result = createProgram([fixturePath]);

    expect(result.program).toBeDefined();
    expect(result.typeChecker).toBeDefined();
    expect(result.sourceFiles.length).toBeGreaterThan(0);
  });

  it('should exclude node_modules files', () => {
    const fixturePath = path.join(__dirname, 'fixtures/simple.ts');
    const result = createProgram([fixturePath]);

    const hasNodeModules = result.sourceFiles.some((file) =>
      file.fileName.includes('node_modules')
    );

    expect(hasNodeModules).toBe(false);
  });
});
