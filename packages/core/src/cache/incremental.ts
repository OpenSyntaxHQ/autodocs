import ts from 'typescript';
import path from 'path';
import fs from 'fs';
import { FileCache } from './FileCache';
import { CacheMetadata } from './types';
import { extractDocsFromFiles } from '../extractor';
import type { DocEntry } from '../extractor';
import { VERSION } from '../version';

export interface IncrementalBuildOptions {
  files: string[];
  cache: FileCache;
  tsconfig?: string;
  compilerOptions?: ts.CompilerOptions;
  configHash: string;
  onProgram?: (program: ts.Program, sourceFiles: ts.SourceFile[]) => Promise<void> | void;
}

export interface IncrementalBuildResult {
  docs: DocEntry[];
  changedFiles: string[];
  fromCache: number;
  parsed: number;
  program: ts.Program;
  sourceFiles: ts.SourceFile[];
  rootDir: string;
  diagnostics: ts.Diagnostic[];
}

export async function incrementalBuild(
  options: IncrementalBuildOptions
): Promise<IncrementalBuildResult> {
  const files = normalizeFiles(options.files);
  const cache = options.cache;

  if (files.length === 0) {
    return {
      docs: [],
      changedFiles: [],
      fromCache: 0,
      parsed: 0,
      program: ts.createProgram([], {}),
      sourceFiles: [],
      rootDir: process.cwd(),
      diagnostics: [],
    };
  }

  const resolved = resolveCompilerOptions(files, options);
  const programResult = createIncrementalProgram(
    files,
    resolved.compilerOptions,
    resolved.projectReferences
  );

  const program = programResult.program;
  const sourceFiles = programResult.sourceFiles;
  const diagnostics = programResult.diagnostics;
  const rootDir = resolved.rootDir;

  if (options.onProgram) {
    await options.onProgram(program, sourceFiles);
  }

  const metadata: CacheMetadata = {
    version: VERSION,
    tsVersion: ts.version,
    configHash: options.configHash,
  };

  const staleFiles = new Set<string>();

  for (const file of files) {
    const entry = await cache.getEntry(file);
    if (!entry) {
      staleFiles.add(file);
      continue;
    }
    if (!metadataMatches(entry.metadata, metadata)) {
      staleFiles.add(file);
      continue;
    }

    const currentHash = await cache.getFileHash(file);
    if (!currentHash || currentHash !== entry.fileHash) {
      staleFiles.add(file);
    }
  }

  for (const stale of staleFiles) {
    await cache.invalidate(stale);
  }

  const cachedDocs: DocEntry[] = [];
  const changedFiles: string[] = [];

  for (const file of files) {
    const entry = await cache.getEntry(file);
    if (entry && metadataMatches(entry.metadata, metadata)) {
      const docs = await cache.readDocs<DocEntry>(entry);
      cachedDocs.push(...docs);
    } else {
      changedFiles.push(file);
    }
  }

  const newDocs: DocEntry[] = [];

  for (const file of changedFiles) {
    const docsForFile = extractDocsFromFiles(program, [file], { rootDir });
    newDocs.push(...docsForFile);

    const dependencies = resolveDependencies(program, file, resolved.compilerOptions);
    await cache.set(file, docsForFile, dependencies, metadata);
  }

  const combinedDocs = dedupeAndSort([...cachedDocs, ...newDocs]);

  return {
    docs: combinedDocs,
    changedFiles,
    fromCache: cachedDocs.length,
    parsed: newDocs.length,
    program,
    sourceFiles,
    rootDir,
    diagnostics,
  };
}

function normalizeFiles(files: string[]): string[] {
  const normalized = new Set<string>();
  for (const file of files) {
    const resolved = path.normalize(path.resolve(file));
    normalized.add(resolved);
  }
  return Array.from(normalized);
}

function metadataMatches(a: CacheMetadata, b: CacheMetadata): boolean {
  return a.version === b.version && a.tsVersion === b.tsVersion && a.configHash === b.configHash;
}

function resolveCompilerOptions(
  files: string[],
  options: IncrementalBuildOptions
): {
  compilerOptions: ts.CompilerOptions;
  rootDir: string;
  projectReferences?: readonly ts.ProjectReference[];
} {
  const configFile = options.tsconfig || findConfigFile(files[0] || '');
  let compilerOptions: ts.CompilerOptions = {
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    allowJs: false,
    declaration: true,
    ...options.compilerOptions,
  };

  let configDir = process.cwd();

  let projectReferences: readonly ts.ProjectReference[] | undefined;

  if (configFile && fs.existsSync(configFile)) {
    const configPath = path.resolve(configFile);
    configDir = path.dirname(configPath);
    const configContent = ts.readConfigFile(configPath, (p) => ts.sys.readFile(p));

    if (configContent.config) {
      const parsedConfig = ts.parseJsonConfigFileContent(configContent.config, ts.sys, configDir);

      compilerOptions = {
        ...parsedConfig.options,
        ...compilerOptions,
      };
      projectReferences = parsedConfig.projectReferences;
    }
  }

  const cacheDir = options.cache.getCacheDir();
  const buildInfoPath = path.join(cacheDir, 'tsbuildinfo');

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch {
    // ignore
  }

  compilerOptions = {
    ...compilerOptions,
    incremental: true,
    tsBuildInfoFile: buildInfoPath,
  };

  const rootDir = compilerOptions.rootDir
    ? path.resolve(configDir, compilerOptions.rootDir)
    : files[0]
      ? path.dirname(files[0])
      : process.cwd();

  return { compilerOptions, rootDir, projectReferences };
}

function createIncrementalProgram(
  files: string[],
  compilerOptions: ts.CompilerOptions,
  projectReferences?: readonly ts.ProjectReference[]
): { program: ts.Program; sourceFiles: ts.SourceFile[]; diagnostics: ts.Diagnostic[] } {
  const host = ts.createIncrementalCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = ((fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const sourceFile = originalGetSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile
    );
    if (sourceFile && (sourceFile as ts.SourceFile & { version?: string }).version === undefined) {
      (sourceFile as ts.SourceFile & { version?: string }).version = '0';
    }
    return sourceFile;
  }) as ts.CompilerHost['getSourceFile'];
  const program = ts
    .createIncrementalProgram({
      rootNames: files,
      options: compilerOptions,
      host,
      projectReferences,
    })
    .getProgram();

  const sourceFiles = program.getSourceFiles().filter((file) => !shouldSkipFile(file));
  const diagnostics = [...program.getSemanticDiagnostics(), ...program.getSyntacticDiagnostics()];

  return { program, sourceFiles, diagnostics };
}

function shouldSkipFile(sourceFile: ts.SourceFile): boolean {
  return (
    sourceFile.isDeclarationFile ||
    sourceFile.fileName.includes('node_modules') ||
    sourceFile.fileName.endsWith('.d.ts')
  );
}

function resolveDependencies(
  program: ts.Program,
  filePath: string,
  compilerOptions: ts.CompilerOptions
): string[] {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    return [];
  }

  const host = ts.createCompilerHost(compilerOptions, true);
  const dependencies = new Set<string>();
  const containingFile = sourceFile.fileName;

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        const resolved = ts.resolveModuleName(
          moduleSpecifier.text,
          containingFile,
          compilerOptions,
          host
        ).resolvedModule;

        if (
          resolved?.resolvedFileName &&
          !resolved.isExternalLibraryImport &&
          !resolved.resolvedFileName.includes('node_modules') &&
          !resolved.resolvedFileName.endsWith('.d.ts')
        ) {
          dependencies.add(path.normalize(path.resolve(resolved.resolvedFileName)));
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return Array.from(dependencies);
}

function dedupeAndSort(entries: DocEntry[]): DocEntry[] {
  const map = new Map<string, DocEntry>();

  for (const entry of entries) {
    const key = `${entry.kind}:${entry.name}:${entry.fileName}`;
    map.set(key, entry);
  }

  return Array.from(map.values()).sort((a, b) => {
    const kindCompare = a.kind.localeCompare(b.kind);
    if (kindCompare !== 0) {
      return kindCompare;
    }
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.fileName.localeCompare(b.fileName);
  });
}

function findConfigFile(startPath: string): string | undefined {
  let currentDir = path.dirname(path.resolve(startPath));

  for (;;) {
    const configPath = path.join(currentDir, 'tsconfig.json');

    if (fs.existsSync(configPath)) {
      return configPath;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}
