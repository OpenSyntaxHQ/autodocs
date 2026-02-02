export { createProgram, resolveModules, getDependencies } from './parser';
export type { ParserOptions, ParseResult } from './parser';

export { extractDocs } from './extractor';
export type {
  DocEntry,
  DocKind,
  DocComment,
  DocTag,
  Member,
  Parameter,
  TypeParameter,
  TypeInfo,
  Heritage,
  Reference,
  CodeExample,
} from './extractor';

export * from './generators';

export const VERSION = '0.1.0';
