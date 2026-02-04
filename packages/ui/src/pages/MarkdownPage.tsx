import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/Documentation/CodeBlock';
import { cn } from '@/lib/utils';

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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ className, ...props }) => (
            <h1
              className={cn('text-4xl font-semibold tracking-tight text-foreground', className)}
              {...props}
            />
          ),
          h2: ({ className, ...props }) => (
            <h2 className={cn('text-2xl font-semibold tracking-tight', className)} {...props} />
          ),
          h3: ({ className, ...props }) => (
            <h3 className={cn('text-xl font-semibold tracking-tight', className)} {...props} />
          ),
          p: ({ className, ...props }) => (
            <p className={cn('text-base text-muted-foreground', className)} {...props} />
          ),
          a: ({ className, ...props }) => (
            <a
              className={cn(
                'font-medium text-primary underline-offset-4 hover:underline',
                className
              )}
              {...props}
            />
          ),
          ul: ({ className, ...props }) => (
            <ul className={cn('space-y-2 pl-6 text-muted-foreground', className)} {...props} />
          ),
          ol: ({ className, ...props }) => (
            <ol className={cn('space-y-2 pl-6 text-muted-foreground', className)} {...props} />
          ),
          li: ({ className, ...props }) => <li className={cn('list-disc', className)} {...props} />,
          blockquote: ({ className, ...props }) => (
            <blockquote
              className={cn(
                'rounded-xl border-l-4 border-primary/40 bg-muted/60 p-4 text-sm text-muted-foreground',
                className
              )}
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const language = className?.replace('language-', '') || 'text';
            const isInline = !className;
            const codeText =
              typeof children === 'string'
                ? children
                : Array.isArray(children)
                  ? children.join('')
                  : '';
            if (isInline) {
              return (
                <code
                  className={cn(
                    'rounded-md bg-muted/60 px-2 py-0.5 font-mono text-sm text-foreground',
                    className
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4">
                <CodeBlock code={codeText.replace(/\n$/, '')} language={language} />
              </div>
            );
          },
          table: ({ className, ...props }) => (
            <div className="overflow-x-auto">
              <table className={cn('w-full border-collapse text-sm', className)} {...props} />
            </div>
          ),
          th: ({ className, ...props }) => (
            <th
              className={cn(
                'border-b border-border/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground',
                className
              )}
              {...props}
            />
          ),
          td: ({ className, ...props }) => (
            <td className={cn('border-b border-border/40 px-3 py-2', className)} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
