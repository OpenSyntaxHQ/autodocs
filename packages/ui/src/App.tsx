import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import { HomePage } from './pages/HomePage';
import { GuidePage } from './pages/GuidePage';
import { MarkdownPage } from './pages/MarkdownPage';
import { SectionPage } from './pages/SectionPage';
import { TypePage } from './pages/TypePage';
import { useStore } from './store';
import { useEffect, useState } from 'react';
import { applyTheme, loadConfig, loadDocs } from './lib/loaders';

export function App() {
  const docs = useStore((state) => state.docs);
  const setDocs = useStore((state) => state.setDocs);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const setConfig = useStore((state) => state.setConfig);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply theme class on mount and when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [configData, docsData] = await Promise.all([loadConfig(), loadDocs()]);

        if (!active) {
          return;
        }

        if (configData) {
          setConfig(configData);
          applyTheme(configData);
          if (configData.features?.darkMode === false) {
            setTheme('light');
          }
        }

        if (docs.length === 0) {
          setDocs(docsData.entries);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load documentation');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [docs.length, setDocs, setConfig, setTheme]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading documentation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold">Unable to load docs</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs/*" element={<MarkdownPage />} />
          <Route path="/guide/:name" element={<GuidePage />} />
          <Route path="/section/:slug" element={<SectionPage />} />
          <Route path="/:kind/:name" element={<TypePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
