import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useStore, DocEntry } from '../store';

const docs: DocEntry[] = [
  {
    id: 'fn-alpha',
    name: 'Alpha',
    kind: 'function',
    fileName: 'src/alpha.ts',
    position: { line: 1, column: 0 },
    signature: 'function Alpha(): void',
  },
  {
    id: 'type-foo',
    name: 'Foo',
    kind: 'type',
    fileName: 'src/foo.ts',
    position: { line: 1, column: 0 },
    signature: 'type Foo = string',
  },
];

describe('HomePage', () => {
  it('renders statistics and entry cards', () => {
    useStore.setState({
      docs,
      config: { features: { search: true } },
    });

    const { getByText } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(getByText('API Documentation')).toBeInTheDocument();
    expect(getByText('Entries')).toBeInTheDocument();
    expect(getByText('Kinds')).toBeInTheDocument();
    expect(getByText('Modules')).toBeInTheDocument();
    expect(getByText('Browse by kind')).toBeInTheDocument();
  });
});
