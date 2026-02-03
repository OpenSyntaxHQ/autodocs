import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import { HomePage } from './pages/HomePage';
import { TypePage } from './pages/TypePage';
import { SearchDialog } from './components/Search/SearchDialog';
import { useStore, DocEntry } from './store';
import { useEffect } from 'react';

interface DocsResponse {
  entries: DocEntry[];
}

export function App() {
  const docs = useStore((state) => state.docs);
  const setDocs = useStore((state) => state.setDocs);
  const theme = useStore((state) => state.theme);

  // Apply theme class on mount and when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load docs on mount
  useEffect(() => {
    if (docs.length === 0) {
      fetch('/docs.json')
        .then((res) => res.json() as Promise<DocsResponse>)
        .then((data) => {
          setDocs(data.entries);
        })
        .catch(console.error);
    }
  }, [docs.length, setDocs]);

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:kind/:name" element={<TypePage />} />
        </Routes>
      </AppShell>
      <SearchDialog />
    </BrowserRouter>
  );
}
