import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { TypePage } from './TypePage';
import { useStore, DocEntry } from '../store';

const docs: DocEntry[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    kind: 'function',
    fileName: 'src/alpha.ts',
    position: { line: 1, column: 0 },
    signature: 'function Alpha(): void',
  },
];

describe('TypePage', () => {
  it('renders documentation when entry exists', () => {
    useStore.setState({ docs });

    const { getByText } = render(
      <MemoryRouter initialEntries={['/function/Alpha']}>
        <Routes>
          <Route path="/:kind/:name" element={<TypePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('Alpha')).toBeInTheDocument();
  });

  it('shows not found for missing entry', () => {
    useStore.setState({ docs: [] });

    const { getByText } = render(
      <MemoryRouter initialEntries={['/function/Missing']}>
        <Routes>
          <Route path="/:kind/:name" element={<TypePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('Not Found')).toBeInTheDocument();
  });
});
