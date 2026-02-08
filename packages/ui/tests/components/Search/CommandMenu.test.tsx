import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandMenu } from '@/components/Search/CommandMenu';
import { useStore, DocEntry } from '@/store';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
  beforeEach(() => {
    mockNavigate.mockClear();
  });

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

  it('shows empty state for unmatched query', async () => {
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

    const input = getByPlaceholderText('Type a command or search...');
    await user.type(input, 'zzz');

    await waitFor(() => {
      expect(getByText('No results found.')).toBeInTheDocument();
    });
  });

  it('navigates when a suggestion is selected', async () => {
    useStore.setState({
      docs,
      searchOpen: true,
    });

    const user = userEvent.setup();

    const { getByText } = render(
      <MemoryRouter>
        <CommandMenu />
      </MemoryRouter>
    );

    await user.click(getByText('Alpha'));

    expect(mockNavigate).toHaveBeenCalledWith('/function/alpha/alpha');
  });
});
