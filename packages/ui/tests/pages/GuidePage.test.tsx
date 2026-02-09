import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, afterEach } from 'vitest';
import { GuidePage } from '@/pages/GuidePage';
import { useStore } from '@/store';

describe('GuidePage', () => {
  afterEach(() => {
    act(() => {
      useStore.setState({ docs: [] });
    });
  });
  it('renders markdown guides from metadata', async () => {
    const guideId = 'a1b2c3d4';
    act(() => {
      useStore.setState({
        docs: [
          {
            id: guideId,
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
      <MemoryRouter initialEntries={[`/guide/${guideId}/getting-started`]}>
        <Routes>
          <Route path="/guide/:id/:slug?" element={<GuidePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Hello guide')).toBeInTheDocument();
  });

  it('renders HTML guides from metadata when html is present', async () => {
    const guideId = 'd4c3b2a1';
    act(() => {
      useStore.setState({
        docs: [
          {
            id: guideId,
            name: 'HTML Guide',
            kind: 'guide',
            fileName: 'html-guide.md',
            position: { line: 1, column: 0 },
            signature: '',
            metadata: { html: '<h2>Rendered HTML guide</h2><p>Body</p>' },
          },
        ],
      });
    });

    render(
      <MemoryRouter initialEntries={[`/guide/${guideId}/html-guide`]}>
        <Routes>
          <Route path="/guide/:id/:slug?" element={<GuidePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Rendered HTML guide')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders a not found state for unknown guides', () => {
    act(() => {
      useStore.setState({ docs: [] });
    });

    render(
      <MemoryRouter initialEntries={['/guide/ffffffff/missing']}>
        <Routes>
          <Route path="/guide/:id/:slug?" element={<GuidePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Guide not found')).toBeInTheDocument();
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
  });
});
