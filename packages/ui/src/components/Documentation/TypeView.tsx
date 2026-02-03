import { CodeBlock } from './CodeBlock';
import { DocEntry } from '../../store';

interface TypeViewProps {
  entry: DocEntry;
}

export function TypeView({ entry }: TypeViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-4xl font-bold">{entry.name}</h1>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
            {entry.kind}
          </span>
        </div>

        {entry.documentation?.summary && (
          <p className="text-lg text-gray-600 dark:text-gray-400">{entry.documentation.summary}</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Signature</h2>
        <CodeBlock code={entry.signature} language="typescript" />
      </div>

      {entry.members && entry.members.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Properties</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Optional</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {entry.members.map((member) => (
                  <tr key={member.name}>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono">{member.name}</code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                        {member.type}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm">{member.optional ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {member.documentation || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entry.parameters && entry.parameters.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Parameters</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Optional</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {entry.parameters.map((param) => (
                  <tr key={param.name}>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono">{param.name}</code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                        {param.type}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm">{param.optional ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {param.documentation || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entry.returnType && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Returns</h2>
          <code className="block rounded-lg bg-gray-100 px-4 py-3 font-mono text-indigo-600 dark:bg-gray-800 dark:text-indigo-400">
            {entry.returnType.text}
          </code>
        </div>
      )}

      {entry.documentation?.examples && entry.documentation.examples.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Examples</h2>
          <div className="space-y-4">
            {entry.documentation.examples.map((example, index) => (
              <CodeBlock key={index} code={example.code} language={example.language} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
