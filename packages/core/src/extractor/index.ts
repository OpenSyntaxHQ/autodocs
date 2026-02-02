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

export function extractDocs(program: ts.Program): DocEntry[] {
  const output: DocEntry[] = [];
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (shouldSkipFile(sourceFile)) {
      continue;
    }

    const symbols = getExportedSymbols(sourceFile, checker);

    for (const symbol of symbols) {
      const entry = serializeSymbol(symbol, checker, sourceFile);
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
  sourceFile: ts.SourceFile
): DocEntry | null {
  const declaration = symbol.valueDeclaration || symbol.declarations?.[0];

  if (!declaration) {
    return null;
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    return serializeInterface(symbol, checker, sourceFile);
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    return serializeTypeAlias(symbol, checker, sourceFile);
  }

  if (ts.isFunctionDeclaration(declaration)) {
    return serializeFunction(symbol, checker, sourceFile);
  }

  if (ts.isClassDeclaration(declaration)) {
    return serializeClass(symbol, checker, sourceFile);
  }

  if (ts.isEnumDeclaration(declaration)) {
    return serializeEnum(symbol, checker, sourceFile);
  }

  if (ts.isVariableDeclaration(declaration)) {
    return serializeVariable(symbol, checker, sourceFile);
  }

  return null;
}
