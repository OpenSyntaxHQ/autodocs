import ts from 'typescript';
import { DocEntry } from '../extractor';

export interface Plugin {
  name: string;
  version: string;

  initialize?(context: PluginContext): void | Promise<void>;
  beforeParse?(files: string[]): string[] | Promise<string[]>;
  afterParse?(program: ts.Program): void | Promise<void>;
  beforeExtract?(sourceFiles: ts.SourceFile[]): void | Promise<void>;
  afterExtract?(docs: DocEntry[]): DocEntry[] | Promise<DocEntry[]>;
  beforeGenerate?(docs: DocEntry[]): DocEntry[] | Promise<DocEntry[]>;
  afterGenerate?(outputDir: string): void | Promise<void>;
  cleanup?(): void | Promise<void>;
}

export interface PluginContext {
  config: unknown;
  logger: Logger;
  cache: Map<string, unknown>;
  emitEvent(name: string, data: unknown): void;
  addHook(name: string, handler: (data: unknown) => void): void;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
