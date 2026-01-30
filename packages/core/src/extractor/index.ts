import ts from 'typescript';

export interface DocEntry {
  name?: string;
  kind?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
  members?: DocEntry[];
}

export function extractDocs(program: ts.Program): DocEntry[] {
  const output: DocEntry[] = [];
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile && !sourceFile.fileName.includes('node_modules')) {
      ts.forEachChild(sourceFile, visit);
    }
  }

  function visit(node: ts.Node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    if (ts.isInterfaceDeclaration(node) && node.name) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        output.push(serializeInterface(symbol, checker));
      }
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        output.push(serializeFunction(symbol, checker));
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        output.push(serializeClass(symbol, checker));
      }
    }
  }

  return output;
}

function serializeInterface(symbol: ts.Symbol, checker: ts.TypeChecker): DocEntry {
  const details: DocEntry = {
    name: symbol.getName(),
    kind: 'interface',
    documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
    type: checker.typeToString(checker.getTypeAtLocation(symbol.valueDeclaration!)),
    members: []
  };
  
  if (symbol.members) {
    symbol.members.forEach((member) => {
      // In a real implementation we would handle inherited members too
      if (member.valueDeclaration || member.declarations) {
         // member.valueDeclaration might be undefined for some merged symbols, check declarations
         const declaration = member.valueDeclaration || member.declarations?.[0];
         if (declaration) {
            details.members!.push({
               name: member.getName(),
               kind: 'property',
               documentation: ts.displayPartsToString(member.getDocumentationComment(checker)),
               type: checker.typeToString(checker.getTypeOfSymbolAtLocation(member, declaration))
            });
         }
      }
    });
  }

  return details;
}

function serializeFunction(symbol: ts.Symbol, checker: ts.TypeChecker): DocEntry {
  const details: DocEntry = {
    name: symbol.getName(),
    kind: 'function',
    documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
    parameters: []
  };

  const signature = checker.getSignatureFromDeclaration(symbol.valueDeclaration as ts.SignatureDeclaration);
  if (signature) {
    details.returnType = checker.typeToString(signature.getReturnType());
    signature.parameters.forEach(param => {
       const declaration = param.valueDeclaration;
       if (declaration) {
         details.parameters!.push({
            name: param.getName(),
            documentation: ts.displayPartsToString(param.getDocumentationComment(checker)),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(param, declaration))
         });
       }
    });
  }

  return details;
}

function serializeClass(symbol: ts.Symbol, checker: ts.TypeChecker): DocEntry {
    const details: DocEntry = {
        name: symbol.getName(),
        kind: 'class',
        documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker))
    };
    return details;
}


function isNodeExported(node: ts.Node): boolean {
  return (
    (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}
