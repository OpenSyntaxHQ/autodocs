import ts from 'typescript';
import crypto from 'crypto';
import { DocEntry, Member, Parameter, TypeParameter, Heritage } from './types';
import { getJSDocTags, typeToString } from './utils';

export function serializeInterface(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): DocEntry {
  const declaration = (symbol.valueDeclaration ||
    symbol.declarations?.[0]) as ts.InterfaceDeclaration;
  const type = checker.getTypeAtLocation(declaration);

  // Get position
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());

  // Get type parameters
  const typeParameters: TypeParameter[] = [];
  if (declaration.typeParameters) {
    for (const tp of declaration.typeParameters) {
      typeParameters.push({
        name: tp.name.text,
        constraint: tp.constraint
          ? typeToString(checker.getTypeFromTypeNode(tp.constraint), checker)
          : undefined,
        default: tp.default
          ? typeToString(checker.getTypeFromTypeNode(tp.default), checker)
          : undefined,
      });
    }
  }

  // Get heritage (extends)
  const heritage: Heritage[] = [];
  if (declaration.heritageClauses) {
    for (const clause of declaration.heritageClauses) {
      for (const typeNode of clause.types) {
        const heritageType = checker.getTypeAtLocation(typeNode);
        const heritageSymbol = heritageType.getSymbol();

        heritage.push({
          id: generateId(heritageSymbol?.getName() || 'unknown'),
          name: heritageSymbol?.getName() || 'unknown',
          kind: 'extends',
        });
      }
    }
  }

  // Get members
  const members: Member[] = [];
  const properties = type.getProperties();

  for (const prop of properties) {
    const propType = checker.getTypeOfSymbolAtLocation(prop, declaration);
    const propDeclaration = prop.valueDeclaration;

    members.push({
      name: prop.getName(),
      type: typeToString(propType, checker),
      optional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
      readonly:
        propDeclaration &&
        ts.isPropertySignature(propDeclaration) &&
        propDeclaration.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword)
          ? true
          : false,
      documentation: ts.displayPartsToString(prop.getDocumentationComment(checker)),
    });
  }

  return {
    id: generateId(symbol.getName()),
    name: symbol.getName(),
    kind: 'interface',
    fileName: sourceFile.fileName,
    position: { line: line + 1, column: character },
    signature: generateInterfaceSignature(declaration, checker),
    documentation: getJSDocTags(symbol, checker),
    typeParameters: typeParameters.length > 0 ? typeParameters : undefined,
    members,
    heritage: heritage.length > 0 ? heritage : undefined,
  };
}

export function serializeTypeAlias(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): DocEntry {
  const declaration = (symbol.valueDeclaration ||
    symbol.declarations?.[0]) as ts.TypeAliasDeclaration;
  const type = checker.getTypeAtLocation(declaration);

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());

  const typeParameters: TypeParameter[] = [];
  if (declaration.typeParameters) {
    for (const tp of declaration.typeParameters) {
      typeParameters.push({
        name: tp.name.text,
        constraint: tp.constraint
          ? typeToString(checker.getTypeFromTypeNode(tp.constraint), checker)
          : undefined,
        default: tp.default
          ? typeToString(checker.getTypeFromTypeNode(tp.default), checker)
          : undefined,
      });
    }
  }

  return {
    id: generateId(symbol.getName()),
    name: symbol.getName(),
    kind: 'type',
    fileName: sourceFile.fileName,
    position: { line: line + 1, column: character },
    signature: `type ${symbol.getName()} = ${typeToString(type, checker)}`,
    documentation: getJSDocTags(symbol, checker),
    typeParameters: typeParameters.length > 0 ? typeParameters : undefined,
  };
}

export function serializeFunction(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): DocEntry {
  const declaration = (symbol.valueDeclaration ||
    symbol.declarations?.[0]) as ts.FunctionDeclaration;

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());

  const signature = checker.getSignatureFromDeclaration(declaration);

  if (!signature) {
    throw new Error(`No signature found for function ${symbol.getName()}`);
  }

  const parameters: Parameter[] = [];
  for (const param of signature.parameters) {
    const paramDeclaration = param.valueDeclaration as ts.ParameterDeclaration;

    parameters.push({
      name: param.getName(),
      type: typeToString(checker.getTypeOfSymbolAtLocation(param, paramDeclaration), checker),
      optional: checker.isOptionalParameter(paramDeclaration),
      defaultValue: paramDeclaration.initializer
        ? paramDeclaration.initializer.getText()
        : undefined,
      rest: paramDeclaration.dotDotDotToken !== undefined,
      documentation: ts.displayPartsToString(param.getDocumentationComment(checker)),
    });
  }

  const returnType = signature.getReturnType();

  return {
    id: generateId(symbol.getName()),
    name: symbol.getName(),
    kind: 'function',
    fileName: sourceFile.fileName,
    position: { line: line + 1, column: character },
    signature: generateFunctionSignature(declaration, checker),
    documentation: getJSDocTags(symbol, checker),
    parameters,
    returnType: {
      text: typeToString(returnType, checker),
      kind: checker.typeToString(returnType),
    },
  };
}

export function serializeClass(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): DocEntry {
  const declaration = (symbol.valueDeclaration || symbol.declarations?.[0]) as ts.ClassDeclaration;

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());

  // Get type parameters
  const typeParameters: TypeParameter[] = [];
  if (declaration.typeParameters) {
    for (const tp of declaration.typeParameters) {
      typeParameters.push({
        name: tp.name.text,
        constraint: tp.constraint
          ? typeToString(checker.getTypeFromTypeNode(tp.constraint), checker)
          : undefined,
        default: tp.default
          ? typeToString(checker.getTypeFromTypeNode(tp.default), checker)
          : undefined,
      });
    }
  }

  // Get heritage (extends/implements)
  const heritage: Heritage[] = [];
  if (declaration.heritageClauses) {
    for (const clause of declaration.heritageClauses) {
      for (const typeNode of clause.types) {
        const heritageType = checker.getTypeAtLocation(typeNode);
        const heritageSymbol = heritageType.getSymbol();
        const kind = clause.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements';

        heritage.push({
          id: generateId(heritageSymbol?.getName() || 'unknown'),
          name: heritageSymbol?.getName() || 'unknown',
          kind,
        });
      }
    }
  }

  // Get members
  const members: Member[] = [];

  // declaration.members is typically defined if it is a class declaration
  for (const member of declaration.members) {
    if (ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member)) {
      const memberName = member.name.getText();
      const memberSymbol = checker.getSymbolAtLocation(member.name);

      if (!memberSymbol) continue;

      // Skip private members
      const isPrivate = member.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword);
      if (isPrivate) continue;

      const memberType = checker.getTypeOfSymbolAtLocation(memberSymbol, member);

      members.push({
        name: memberName,
        type: typeToString(memberType, checker),
        optional: (memberSymbol.flags & ts.SymbolFlags.Optional) !== 0,
        readonly: member.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword) || false,
        documentation: ts.displayPartsToString(memberSymbol.getDocumentationComment(checker)),
      });
    }
  }

  return {
    id: generateId(symbol.getName()),
    name: symbol.getName(),
    kind: 'class',
    fileName: sourceFile.fileName,
    position: { line: line + 1, column: character },
    signature: `class ${symbol.getName()}`,
    documentation: getJSDocTags(symbol, checker),
    typeParameters: typeParameters.length > 0 ? typeParameters : undefined,
    heritage: heritage.length > 0 ? heritage : undefined,
    members: members.length > 0 ? members : undefined,
  };
}

export function serializeEnum(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): DocEntry {
  const declaration = (symbol.valueDeclaration || symbol.declarations?.[0]) as ts.EnumDeclaration;

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());

  return {
    id: generateId(symbol.getName()),
    name: symbol.getName(),
    kind: 'enum',
    fileName: sourceFile.fileName,
    position: { line: line + 1, column: character },
    signature: `enum ${symbol.getName()}`,
    documentation: getJSDocTags(symbol, checker),
  };
}

export function serializeVariable(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): DocEntry {
  const declaration = (symbol.valueDeclaration ||
    symbol.declarations?.[0]) as ts.VariableDeclaration;
  const type = checker.getTypeAtLocation(declaration);

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());

  return {
    id: generateId(symbol.getName()),
    name: symbol.getName(),
    kind: 'variable',
    fileName: sourceFile.fileName,
    position: { line: line + 1, column: character },
    signature: `const ${symbol.getName()}: ${typeToString(type, checker)}`,
    documentation: getJSDocTags(symbol, checker),
  };
}

function generateId(name: string): string {
  return crypto.createHash('md5').update(name).digest('hex').slice(0, 8);
}

function generateInterfaceSignature(
  declaration: ts.InterfaceDeclaration,
  _checker: ts.TypeChecker
): string {
  const name = declaration.name.text;
  const typeParams = declaration.typeParameters
    ? `<${declaration.typeParameters.map((tp) => tp.name.text).join(', ')}>`
    : '';

  return `interface ${name}${typeParams}`;
}

function generateFunctionSignature(
  declaration: ts.FunctionDeclaration,
  _checker: ts.TypeChecker
): string {
  const name = declaration.name?.text || 'anonymous';
  const params = declaration.parameters
    .map((p) => {
      const paramName = p.name.getText();
      const paramType = p.type ? p.type.getText() : 'any';
      const optional = p.questionToken ? '?' : '';
      return `${paramName}${optional}: ${paramType}`;
    })
    .join(', ');

  const returnType = declaration.type ? declaration.type.getText() : 'void';

  return `function ${name}(${params}): ${returnType}`;
}
