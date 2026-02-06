const internalThing = 'hidden';

export const exportedValue = 42;

export function exportedFn() {
  return exportedValue;
}

export { exportedFn as aliasFn };

export interface ExportedInterface {
  id: string;
}

export enum ExportedEnum {
  Alpha = 'alpha',
  Beta = 'beta',
  Gamma = 'gamma',
}

export class ExportedClass {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  greet() {
    return `Hello ${this.name}`;
  }

  private secret() {
    return internalThing;
  }
}
