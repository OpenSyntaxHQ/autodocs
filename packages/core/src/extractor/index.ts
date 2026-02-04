import ts from 'typescript';
import { DocEntry } from './types';
import { getExportedSymbols } from '../parser/utils';
import {
  serializeInterface,
  serializeTypeAlias,
  serializeFunction,
  serializeClass,
  serializeEnum,
  serializeVariable,
} from './serializers';

export * from './types';

interface ExtractOptions {
  rootDir?: string;
}

export function extractDocs(program: ts.Program, options: ExtractOptions = {}): DocEntry[] {
  const output: DocEntry[] = [];
  const checker = program.getTypeChecker();
  const seenSymbols = new Set<ts.Symbol>();

  for (const sourceFile of program.getSourceFiles()) {
    if (shouldSkipFile(sourceFile)) {
      continue;
    }

    const symbols = getExportedSymbols(sourceFile, checker);

    for (const symbol of symbols) {
      if (seenSymbols.has(symbol)) {
        continue;
      }
      seenSymbols.add(symbol);

      const entry = serializeSymbol(symbol, checker, options.rootDir);
      if (entry) {
        output.push(entry);
      }
    }
  }

  return output;
}

function shouldSkipFile(sourceFile: ts.SourceFile): boolean {
  return (
    sourceFile.isDeclarationFile ||
    sourceFile.fileName.includes('node_modules') ||
    sourceFile.fileName.endsWith('.test.ts') ||
    sourceFile.fileName.endsWith('.spec.ts')
  );
}

function serializeSymbol(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  rootDir?: string
): DocEntry | null {
  const declaration = symbol.valueDeclaration || symbol.declarations?.[0];

  if (!declaration) {
    return null;
  }

  const declarationSourceFile = declaration.getSourceFile();
  if (shouldSkipFile(declarationSourceFile)) {
    return null;
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    return serializeInterface(symbol, checker, declarationSourceFile, rootDir);
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    return serializeTypeAlias(symbol, checker, declarationSourceFile, rootDir);
  }

  if (ts.isFunctionDeclaration(declaration)) {
    return serializeFunction(symbol, checker, declarationSourceFile, rootDir);
  }

  if (ts.isClassDeclaration(declaration)) {
    return serializeClass(symbol, checker, declarationSourceFile, rootDir);
  }

  if (ts.isEnumDeclaration(declaration)) {
    return serializeEnum(symbol, checker, declarationSourceFile, rootDir);
  }

  if (ts.isVariableDeclaration(declaration)) {
    return serializeVariable(symbol, checker, declarationSourceFile, rootDir);
  }

  return null;
}
