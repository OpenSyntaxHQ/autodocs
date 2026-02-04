import ts from 'typescript';
import { DocComment, DocTag, CodeExample } from './types';

export function typeToString(type: ts.Type, checker: ts.TypeChecker): string {
  return checker.typeToString(type);
}

export function getJSDocTags(symbol: ts.Symbol, checker: ts.TypeChecker): DocComment {
  const tags: DocTag[] = [];
  const examples: CodeExample[] = [];
  const params: Array<{ name: string; type?: string; text: string }> = [];
  let returns: string | undefined;
  let deprecated: string | undefined;
  const paramTypes = getParamTypeMap(symbol);

  const jsDocTags = symbol.getJsDocTags(checker);

  for (const tag of jsDocTags) {
    const tagText = normalizeTagText(tag);

    if (tag.name === 'example') {
      if (tagText.trim()) {
        examples.push(parseExample(tagText));
      }
      continue;
    }

    if (tag.name === 'param') {
      const parsed = parseParamTag(tagText);
      if (parsed.name && !parsed.type) {
        const inferredType = paramTypes.get(parsed.name);
        if (inferredType) {
          parsed.type = inferredType;
        }
      }
      if (parsed.name) {
        params.push(parsed);
      }
      continue;
    }

    if (tag.name === 'returns' || tag.name === 'return') {
      returns = tagText.trim();
      continue;
    }

    if (tag.name === 'deprecated') {
      deprecated = tagText.trim() || 'Deprecated';
      continue;
    }

    tags.push({
      name: tag.name,
      text: tagText,
    });
  }

  const summary = ts.displayPartsToString(symbol.getDocumentationComment(checker));

  return {
    summary,
    tags,
    examples: examples.length > 0 ? examples : undefined,
    params: params.length > 0 ? params : undefined,
    returns,
    deprecated,
  };
}

function getParamTypeMap(symbol: ts.Symbol): Map<string, string> {
  const map = new Map<string, string>();
  const declarations = symbol.getDeclarations() ?? [];

  for (const declaration of declarations) {
    const jsDocTags = ts.getJSDocTags(declaration);
    for (const tag of jsDocTags) {
      if (ts.isJSDocParameterTag(tag)) {
        const name = tag.name.getText();
        const typeNode = tag.typeExpression?.type;
        const type = typeNode ? typeNode.getText() : undefined;
        if (name && type) {
          map.set(name, type);
        }
      }
    }
  }

  return map;
}

function normalizeTagText(tag: ts.JSDocTagInfo): string {
  if (!tag.text) {
    return '';
  }

  if (Array.isArray(tag.text)) {
    return ts.displayPartsToString(tag.text);
  }

  return ts.displayPartsToString([tag.text]);
}

function parseParamTag(text: string): { name: string; type?: string; text: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { name: '', text: '' };
  }

  const typeMatch = trimmed.match(/^\{([^}]+)\}\s*(.*)$/);
  const type = typeMatch ? typeMatch[1] : undefined;
  const rest = typeMatch ? (typeMatch[2] ?? '') : trimmed;

  const [namePart, ...descParts] = rest.split(/\s+/);
  const description = descParts.join(' ').replace(/^[-–—]\s*/, '');

  return {
    name: namePart || '',
    type,
    text: description,
  };
}

function parseExample(text: string): CodeExample {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(\w+)?\n([\s\S]*?)```/);

  if (fenced) {
    return {
      language: fenced[1] || 'typescript',
      code: (fenced[2] ?? '').trim(),
    };
  }

  return {
    language: 'typescript',
    code: trimmed,
  };
}
