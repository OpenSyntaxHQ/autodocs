import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/Documentation/MarkdownRenderer';

const markdown = `# Title\n\n## Subtitle\n\nParagraph with [link](https://example.com) and \`inline\` code.\n\n> Quote here\n\n- Item one\n- Item two\n\n1. First\n2. Second\n\n\`\`\`ts\nconst x = 1;\n\`\`\`\n\n| Col | Val |\n| --- | --- |\n| A | B |\n`;

describe('MarkdownRenderer', () => {
  it('renders markdown elements and code blocks', () => {
    const { getByRole, getByText, container } = render(<MarkdownRenderer markdown={markdown} />);

    expect(getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Subtitle' })).toBeInTheDocument();

    const link = getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com');

    expect(getByText('inline')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).not.toBeNull();
    expect(container.querySelector('table')).not.toBeNull();

    expect(getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(getByText('const x = 1;')).toBeInTheDocument();
  });
});
