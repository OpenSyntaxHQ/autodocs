import ts from 'typescript';
import { DocComment, DocTag, CodeExample } from './types';

export function typeToString(type: ts.Type, checker: ts.TypeChecker): string {
  return checker.typeToString(type);
}

export function getJSDocTags(symbol: ts.Symbol, checker: ts.TypeChecker): DocComment {
  const tags: DocTag[] = [];
  const examples: CodeExample[] = [];

  const jsDocTags = symbol.getJsDocTags(checker);

  for (const tag of jsDocTags) {
    const tagText = tag.text
      ? ts.displayPartsToString(Array.isArray(tag.text) ? tag.text : [tag.text])
      : '';

    if (tag.name === 'example') {
      examples.push({
        code: tagText.trim(),
        language: 'typescript',
      });
    } else {
      tags.push({
        name: tag.name,
        text: tagText,
      });
    }
  }

  const summary = ts.displayPartsToString(symbol.getDocumentationComment(checker));

  return {
    summary,
    tags,
    examples: examples.length > 0 ? examples : undefined,
  };
}
