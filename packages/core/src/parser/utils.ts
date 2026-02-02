import ts from 'typescript';

export function isNodeExported(node: ts.Node): boolean {
  const flags = ts.getCombinedModifierFlags(node as ts.Declaration);

  return (
    (flags & ts.ModifierFlags.Export) !== 0 ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}

export function getExportedSymbols(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): ts.Symbol[] {
  const symbols: ts.Symbol[] = [];

  function visit(node: ts.Node) {
    if (isNodeExported(node)) {
      if (
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isVariableStatement(node)
      ) {
        const symbol = getSymbolForNode(node, typeChecker);
        if (symbol) {
          symbols.push(symbol);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return symbols;
}

function getSymbolForNode(node: ts.Node, typeChecker: ts.TypeChecker): ts.Symbol | undefined {
  if (ts.isVariableStatement(node)) {
    // Get symbol from first declaration
    const declaration = node.declarationList.declarations[0];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (declaration && declaration.name && ts.isIdentifier(declaration.name)) {
      return typeChecker.getSymbolAtLocation(declaration.name);
    }
  }

  const namedNode = node as { name?: ts.Node };
  if (namedNode.name && ts.isIdentifier(namedNode.name)) {
    return typeChecker.getSymbolAtLocation(namedNode.name);
  }

  return undefined;
}
