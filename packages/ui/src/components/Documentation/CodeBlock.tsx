interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 dark:bg-gray-800">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{language}</span>
      </div>
      <pre className="overflow-x-auto bg-gray-900 p-4 text-sm text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
