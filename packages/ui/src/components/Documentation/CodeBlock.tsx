import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      void navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => {
            setCopied(false);
          }, 1600);
        })
        .catch(() => {
          setCopied(false);
        });
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-[#0b1021] text-zinc-100 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0f172a]/70 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
