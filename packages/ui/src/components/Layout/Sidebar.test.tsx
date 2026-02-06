import { describe, it, expect } from 'vitest';
import { Sidebar } from './Sidebar';
import { DocEntry } from '../../store';
import { renderWithStore } from '../../test/helpers';

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
    id: 'class-beta',
    name: 'Beta',
    kind: 'class',
    fileName: 'src/beta.ts',
    position: { line: 1, column: 0 },
    signature: 'class Beta {}',
  },
];

describe('Sidebar', () => {
  it('renders navigation and grouped kinds', () => {
    const { getByText } = renderWithStore(<Sidebar />, {
      initialState: {
        docs,
        config: {
          sidebar: [{ title: 'Getting Started', path: '/docs/intro.md' }],
        },
      },
      route: '/',
    });

    expect(getByText('Overview')).toBeInTheDocument();
    expect(getByText(/functions/i)).toBeInTheDocument();
    expect(getByText(/classes/i)).toBeInTheDocument();
    expect(getByText('Getting Started')).toBeInTheDocument();
  });

  it('highlights the active route', () => {
    const { getByRole } = renderWithStore(<Sidebar />, {
      initialState: { docs },
      route: '/function/Alpha',
    });

    const link = getByRole('link', { name: 'Alpha' });
    expect(link.className).toContain('bg-primary/10');
  });

  it('handles empty docs without crashing', () => {
    const { queryByText } = renderWithStore(<Sidebar />, {
      initialState: { docs: [] },
      route: '/',
    });

    expect(queryByText(/functions/i)).not.toBeInTheDocument();
    expect(queryByText(/classes/i)).not.toBeInTheDocument();
  });
});
