import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandMenu } from './CommandMenu';
import { useStore, DocEntry } from '../../store';

const docs: DocEntry[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    kind: 'function',
    fileName: 'src/alpha.ts',
    position: { line: 1, column: 0 },
    signature: 'function Alpha(): void',
    documentation: { summary: 'Alpha summary', tags: [] },
  },
];

describe('CommandMenu', () => {
  it('shows suggestions and search results', async () => {
    useStore.setState({
      docs,
      searchOpen: true,
    });

    const user = userEvent.setup();

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <CommandMenu />
      </MemoryRouter>
    );

    expect(getByText('Alpha')).toBeInTheDocument();

    const input = getByPlaceholderText('Type a command or search...');
    await user.type(input, 'Alpha');

    await waitFor(() => {
      expect(getByText('Alpha')).toBeInTheDocument();
    });
  });
});
