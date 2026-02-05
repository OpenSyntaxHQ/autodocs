export { createProgram, resolveModules, getDependencies } from './parser';
export type { ParserOptions, ParseResult } from './parser';

export { extractDocs, extractDocsFromFiles } from './extractor';
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

export { PluginManager } from './plugins';
export type { Plugin, PluginContext, Logger } from './plugins';

export { FileCache } from './cache/FileCache';
export { incrementalBuild } from './cache/incremental';
export type { CacheEntry, CacheMetadata, CacheOptions } from './cache/types';

export { VERSION } from './version';
