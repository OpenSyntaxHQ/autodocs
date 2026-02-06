import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AppShell } from './AppShell';
import { useStore } from '../../store';

function renderWithRoute(initialState: Partial<ReturnType<typeof useStore.getState>> = {}) {
  useStore.setState({
    ...useStore.getState(),
    docs: [],
    config: { features: { search: true, darkMode: true } },
    ...initialState,
  });

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>Outlet content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  it('renders header, sidebar, and outlet content', () => {
    const { getByText } = renderWithRoute();

    expect(getByText('Autodocs')).toBeInTheDocument();
    expect(getByText('Outlet content')).toBeInTheDocument();
  });

  it('hides search when disabled', () => {
    const { queryByText } = renderWithRoute({ config: { features: { search: false } } });

    expect(queryByText(/Search documentation/i)).not.toBeInTheDocument();
  });
});
