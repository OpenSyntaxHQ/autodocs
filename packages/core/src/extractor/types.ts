export type DocKind = 'interface' | 'type' | 'class' | 'function' | 'enum' | 'variable';

export interface DocEntry {
  id: string;
  name: string;
  kind: DocKind;
  fileName: string;
  position: { line: number; column: number };
  signature: string;
  documentation?: DocComment;
  typeParameters?: TypeParameter[];
  members?: Member[];
  parameters?: Parameter[];
  returnType?: TypeInfo;
  heritage?: Heritage[];
  modifiers?: string[];
  references?: Reference[];
}

export interface DocComment {
  summary: string;
  description?: string;
  tags: DocTag[];
  examples?: CodeExample[];
}

export interface DocTag {
  name: string;
  text: string;
  type?: string;
  paramName?: string;
}

export interface TypeParameter {
  name: string;
  constraint?: string;
  default?: string;
}

export interface Member {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  documentation?: string;
}

export interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  rest: boolean;
  documentation?: string;
}

export interface TypeInfo {
  text: string;
  kind: string;
}

export interface Heritage {
  id: string;
  name: string;
  kind: 'extends' | 'implements';
}

export interface Reference {
  id: string;
  name: string;
}

export interface CodeExample {
  code: string;
  language: string;
}
