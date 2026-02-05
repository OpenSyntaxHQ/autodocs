import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MarkdownRenderer } from '@/components/Documentation/MarkdownRenderer';

export function MarkdownPage() {
  const location = useLocation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(location.pathname);
        if (!response.ok) {
          throw new Error('Content not found');
        }
        const text = await response.text();
        if (active) {
          setContent(text);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load content');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    void load();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
        Loading content...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <MarkdownRenderer markdown={content} />
    </div>
  );
}
