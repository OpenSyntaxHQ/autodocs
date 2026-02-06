import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TypeView } from './TypeView';
import type { DocEntry } from '../../store';

const baseEntry: DocEntry = {
  id: 'example',
  name: 'Example',
  kind: 'function',
  fileName: 'src/example.ts',
  position: { line: 1, column: 0 },
  signature: 'function Example(value: string): number',
  documentation: {
    summary: 'Example summary',
    deprecated: 'Use ExampleV2 instead',
    tags: [],
    params: [{ name: 'value', text: 'Value parameter' }],
    returns: 'Returns a number',
    examples: [{ language: 'typescript', code: 'Example("test")' }],
  },
  members: [
    {
      name: 'count',
      type: 'number',
      optional: false,
      readonly: false,
    },
  ],
  parameters: [
    {
      name: 'value',
      type: 'string',
      optional: false,
      rest: false,
    },
  ],
  returnType: { text: 'number', kind: 'number' },
};

describe('TypeView', () => {
  it('renders signature, properties, parameters, and examples', () => {
    const { getByRole, getByText } = render(<TypeView entry={baseEntry} />);

    expect(getByRole('heading', { name: 'Signature' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Properties' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Parameters' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Returns' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Examples' })).toBeInTheDocument();
    expect(getByText('Example summary')).toBeInTheDocument();
    expect(getByText('Use ExampleV2 instead')).toBeInTheDocument();
  });

  it('renders enum members table', () => {
    const enumEntry: DocEntry = {
      ...baseEntry,
      kind: 'enum',
      name: 'Status',
      members: [
        {
          name: 'Ready',
          type: 'enum',
          optional: false,
          readonly: true,
          value: 'ready',
        },
      ],
    };

    const { getByText } = render(<TypeView entry={enumEntry} />);

    expect(getByText('Members')).toBeInTheDocument();
    expect(getByText('Ready')).toBeInTheDocument();
    expect(getByText('ready')).toBeInTheDocument();
  });
});
