import ts from 'typescript';
import path from 'path';
import fs from 'fs';

export interface ParserOptions {
  configFile?: string;
  compilerOptions?: ts.CompilerOptions;
  exclude?: string[];
  include?: string[];
  skipLibCheck?: boolean;
}

export interface ParseResult {
  program: ts.Program;
  typeChecker: ts.TypeChecker;
  sourceFiles: ts.SourceFile[];
  diagnostics: ts.Diagnostic[];
  rootDir: string;
}

export function createProgram(entryFiles: string[], options: ParserOptions = {}): ParseResult {
  // Find tsconfig.json if not provided
  const configFile = options.configFile || findConfigFile(entryFiles[0] || '');

  const baseDefaults: ts.CompilerOptions = {
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: options.skipLibCheck ?? true,
    allowJs: false,
    declaration: true,
  };

  let compilerOptions: ts.CompilerOptions = {
    ...baseDefaults,
    ...options.compilerOptions,
  };

  if (configFile && fs.existsSync(configFile)) {
    const configPath = path.resolve(configFile);
    const configContent = ts.readConfigFile(configPath, (path) => ts.sys.readFile(path));

    if (configContent.config) {
      const parsedConfig = ts.parseJsonConfigFileContent(
        configContent.config,
        ts.sys,
        path.dirname(configPath)
      );

      // Merge defaults, config, then explicit overrides
      compilerOptions = {
        ...baseDefaults,
        ...parsedConfig.options,
        ...options.compilerOptions,
      };
    }
  }

  // Create program
  const program = ts.createProgram(entryFiles, compilerOptions);
  const typeChecker = program.getTypeChecker();

  // Get source files (exclude node_modules and .d.ts)
  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (file) =>
        !file.isDeclarationFile &&
        !file.fileName.includes('node_modules') &&
        !file.fileName.includes('.d.ts')
    );

  // Collect diagnostics
  const diagnostics = [...program.getSemanticDiagnostics(), ...program.getSyntacticDiagnostics()];

  return {
    program,
    typeChecker,
    sourceFiles,
    diagnostics,
    rootDir: entryFiles[0] ? path.dirname(entryFiles[0]) : process.cwd(),
  };
}

function findConfigFile(startPath: string): string | undefined {
  let currentDir = path.dirname(path.resolve(startPath));

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const configPath = path.join(currentDir, 'tsconfig.json');

    if (fs.existsSync(configPath)) {
      return configPath;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      // Reached root
      return undefined;
    }

    currentDir = parentDir;
  }
}

export function resolveModules(_program: ts.Program, sourceFile: ts.SourceFile): string[] {
  const modules: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        modules.push(moduleSpecifier.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return modules;
}

export function getDependencies(program: ts.Program, filePath: string): string[] {
  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
    return [];
  }

  return resolveModules(program, sourceFile);
}
