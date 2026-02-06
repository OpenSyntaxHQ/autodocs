import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/store';
import { MarkdownRenderer } from '@/components/Documentation/MarkdownRenderer';
import { Card } from '@/components/ui/card';

interface GuideMetadata {
  markdown?: string;
  html?: string;
  frontMatter?: Record<string, unknown>;
}

export function GuidePage() {
  const { name } = useParams<{ name: string }>();
  const docs = useStore((state) => state.docs);

  const entry = useMemo(
    () => docs.find((doc) => doc.kind === 'guide' && doc.name === name),
    [docs, name]
  );

  if (!entry) {
    return (
      <Card className="border-border/60 bg-card/70 p-8">
        <h1 className="text-2xl font-semibold">Guide not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The guide you requested does not exist.
        </p>
      </Card>
    );
  }

  const metadata = (entry.metadata || {}) as GuideMetadata;

  if (metadata.html) {
    return (
      <div className="max-w-4xl space-y-6 docs-html">
        <div dangerouslySetInnerHTML={{ __html: metadata.html }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <MarkdownRenderer markdown={metadata.markdown || ''} />
    </div>
  );
}
