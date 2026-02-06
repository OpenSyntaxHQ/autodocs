import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  markdown: string;
}

export function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  return (
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
            className={cn('font-medium text-primary underline-offset-4 hover:underline', className)}
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
      {markdown}
    </ReactMarkdown>
  );
}
