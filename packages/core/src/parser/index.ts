import ts from 'typescript';

export function createProgram(entryFiles: string[], options: ts.CompilerOptions = {}): ts.Program {
  const mergedOptions: ts.CompilerOptions = {
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    ...options
  };
  
  return ts.createProgram(entryFiles, mergedOptions);
}
