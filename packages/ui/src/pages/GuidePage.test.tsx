import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, afterEach } from 'vitest';
import { GuidePage } from './GuidePage';
import { useStore } from '@/store';

describe('GuidePage', () => {
  afterEach(() => {
    act(() => {
      useStore.setState({ docs: [] });
    });
  });
  it('renders markdown guides from metadata', async () => {
    act(() => {
      useStore.setState({
        docs: [
          {
            id: 'guide:1',
            name: 'Getting Started',
            kind: 'guide',
            fileName: 'guide.md',
            position: { line: 1, column: 0 },
            signature: '',
            metadata: { markdown: '# Hello guide' },
          },
        ],
      });
    });

    render(
      <MemoryRouter initialEntries={['/guide/Getting%20Started']}>
        <Routes>
          <Route path="/guide/:name" element={<GuidePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Hello guide')).toBeInTheDocument();
  });
});
