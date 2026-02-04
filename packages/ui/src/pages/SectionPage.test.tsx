import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, afterEach, expect } from 'vitest';
import { SectionPage } from './SectionPage';
import { useStore } from '@/store';

describe('SectionPage', () => {
  afterEach(() => {
    act(() => {
      useStore.setState({ docs: [], config: null });
    });
  });

  it('falls back to all entries when no match exists', () => {
    act(() => {
      useStore.setState({
        docs: [
          {
            id: 'alpha',
            name: 'alpha',
            kind: 'function',
            fileName: 'src/store/index.ts',
            module: 'src/store/index',
            position: { line: 1, column: 0 },
            signature: 'function alpha(): void',
          },
        ],
        config: {
          sidebar: [{ title: 'API Reference', autogenerate: 'src/api/' }],
        },
      });
    });

    render(
      <MemoryRouter initialEntries={['/section/api-reference']}>
        <Routes>
          <Route path="/section/:slug" element={<SectionPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.getByText(/No entries matched/i)).toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
  });
});
