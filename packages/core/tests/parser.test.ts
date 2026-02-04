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

  it('should only include exported symbols', () => {
    const fixturePath = path.join(__dirname, 'fixtures/exports.ts');
    const result = createProgram([fixturePath]);
    const sourceFile = result.program.getSourceFile(fixturePath);
    expect(sourceFile).toBeDefined();
    const moduleSymbol = sourceFile
      ? result.typeChecker.getSymbolAtLocation(sourceFile)
      : undefined;
    const symbols = moduleSymbol ? result.typeChecker.getExportsOfModule(moduleSymbol) : [];

    const names = symbols.map((s) => s.getName());

    expect(names).toContain('exportedValue');
    expect(names).toContain('exportedFn');
    expect(names).toContain('aliasFn');
    expect(names).toContain('ExportedInterface');
    expect(names).toContain('ExportedEnum');
    expect(names).toContain('ExportedClass');
    expect(names).not.toContain('internalThing');
  });
});
