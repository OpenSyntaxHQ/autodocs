import { CodeBlock } from './CodeBlock';
import { DocEntry } from '../../store';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TypeViewProps {
  entry: DocEntry;
}

export function TypeView({ entry }: TypeViewProps) {
  const stats = [
    { label: 'Properties', value: entry.members?.length ?? 0 },
    { label: 'Parameters', value: entry.parameters?.length ?? 0 },
    { label: 'Examples', value: entry.documentation?.examples?.length ?? 0 },
  ].filter((stat) => stat.value > 0);

  const moduleName = entry.module || entry.source?.file || entry.fileName;
  const paramDocs = new Map(entry.documentation?.params?.map((p) => [p.name, p]) || []);
  const hasEnumMembers = entry.kind === 'enum' && entry.members && entry.members.length > 0;

  return (
    <div className="space-y-10 animate-rise">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-8 shadow-glow surface-glass">
        <div
          aria-hidden="true"
          className="absolute -left-24 top-6 h-40 w-40 rounded-full blur-[80px]"
          style={{ background: 'var(--glow-2)' }}
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {entry.kind}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {moduleName || 'root'}
              </Badge>
              {entry.documentation?.deprecated && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  Deprecated
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {entry.name}
            </h1>
            {entry.documentation?.summary && (
              <p className="text-lg leading-relaxed text-muted-foreground">
                {entry.documentation.summary}
              </p>
            )}
            {entry.documentation?.deprecated && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {entry.documentation.deprecated}
              </p>
            )}
          </div>

          {stats.length > 0 && (
            <div className="flex w-full flex-wrap gap-3 lg:max-w-[360px] lg:justify-end">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-h-[80px] min-w-[120px] flex-1 flex-col justify-between rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm sm:flex-none"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Signature</h2>
        <CodeBlock code={entry.signature} language="typescript" />
      </section>

      {hasEnumMembers && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Members</h2>
          <Card className="overflow-hidden border-border/60 bg-card/70 p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[240px]">Name</TableHead>
                  <TableHead className="w-[240px]">Value</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.members?.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium font-mono">{member.name}</TableCell>
                    <TableCell>
                      {member.value ? (
                        <code className="relative rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold text-primary">
                          {member.value}
                        </code>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {member.documentation || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}

      {entry.members && entry.members.length > 0 && entry.kind !== 'enum' && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Properties</h2>
          <Card className="overflow-hidden border-border/60 bg-card/70 p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Optional</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.members.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium font-mono">{member.name}</TableCell>
                    <TableCell>
                      <code className="relative rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold text-primary">
                        {member.type}
                      </code>
                    </TableCell>
                    <TableCell>
                      {member.optional ? (
                        <Badge variant="outline" className="rounded-full text-xs">
                          Optional
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full text-xs">
                          Required
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {member.documentation || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}

      {entry.parameters && entry.parameters.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Parameters</h2>
          <Card className="overflow-hidden border-border/60 bg-card/70 p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[120px]">Optional</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.parameters.map((param) => {
                  const doc = param.documentation || paramDocs.get(param.name)?.text || '-';
                  return (
                    <TableRow key={param.name}>
                      <TableCell className="font-medium font-mono">{param.name}</TableCell>
                      <TableCell>
                        <code className="relative rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold text-primary">
                          {param.type}
                        </code>
                      </TableCell>
                      <TableCell>
                        {param.optional ? (
                          <Badge variant="outline" className="rounded-full text-xs">
                            Optional
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            Required
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {doc}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}

      {entry.returnType && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Returns</h2>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
            <code className="font-mono text-sm text-primary">{entry.returnType.text}</code>
            {entry.documentation?.returns && (
              <p className="mt-2 text-sm text-muted-foreground">{entry.documentation.returns}</p>
            )}
          </div>
        </section>
      )}

      {entry.documentation?.examples && entry.documentation.examples.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Examples</h2>
          <div className="space-y-6">
            {entry.documentation.examples.map((example, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Example {index + 1}</h3>
                <CodeBlock code={example.code} language={example.language} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
