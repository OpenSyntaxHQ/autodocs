import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, beforeEach, expect } from 'vitest';
import { Header } from './Header';
import { useStore } from '../../store';

describe('Header', () => {
  beforeEach(() => {
    useStore.setState({
      theme: 'light',
      config: {
        features: { search: false, darkMode: false },
        theme: { logo: '/logo.svg' },
      },
    });
  });

  it('hides search and theme toggle when disabled', () => {
    const { queryByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(queryByText(/Search documentation/i)).not.toBeInTheDocument();
    expect(queryByText(/Search\.\.\./i)).not.toBeInTheDocument();
    expect(queryByText(/Toggle theme/i)).not.toBeInTheDocument();
  });
});
