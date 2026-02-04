import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { MarkdownPage } from './MarkdownPage';

describe('MarkdownPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders markdown content', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Getting Started'),
    } as Response);

    render(
      <MemoryRouter initialEntries={['/docs/intro.md']}>
        <Routes>
          <Route path="/docs/*" element={<MarkdownPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Getting Started')).toBeInTheDocument();
  });
});
