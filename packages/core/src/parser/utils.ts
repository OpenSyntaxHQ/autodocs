import ts from 'typescript';

export function getExportedSymbols(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): ts.Symbol[] {
  const moduleSymbol = typeChecker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return [];
  }

  const exports = typeChecker.getExportsOfModule(moduleSymbol);
  const symbols: ts.Symbol[] = [];
  const seen = new Set<ts.Symbol>();

  for (const symbol of exports) {
    let resolved = symbol;
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      resolved = typeChecker.getAliasedSymbol(symbol);
    }

    if (seen.has(resolved)) {
      continue;
    }

    seen.add(resolved);
    symbols.push(resolved);
  }

  return symbols;
}
