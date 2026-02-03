import { CodeBlock } from './CodeBlock';
import { DocEntry } from '../../store';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{entry.name}</h1>
          <Badge variant="secondary" className="text-sm font-medium capitalize">
            {entry.kind}
          </Badge>
        </div>

        {entry.documentation?.summary && (
          <p className="text-xl text-muted-foreground leading-relaxed">
            {entry.documentation.summary}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Signature</h2>
        <CodeBlock code={entry.signature} language="typescript" />
      </div>

      {entry.members && entry.members.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Properties</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[100px]">Optional</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.members.map((member) => (
                  <TableRow key={member.name}>
                    <TableCell className="font-medium font-mono">{member.name}</TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-primary">
                        {member.type}
                      </code>
                    </TableCell>
                    <TableCell>
                      {member.optional ? (
                        <Badge variant="outline">Optional</Badge>
                      ) : (
                        <Badge variant="secondary">Required</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.documentation || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {entry.parameters && entry.parameters.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Parameters</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead className="w-[100px]">Optional</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.parameters.map((param) => (
                  <TableRow key={param.name}>
                    <TableCell className="font-medium font-mono">{param.name}</TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-primary">
                        {param.type}
                      </code>
                    </TableCell>
                    <TableCell>
                      {param.optional ? (
                        <Badge variant="outline">Optional</Badge>
                      ) : (
                        <Badge variant="secondary">Required</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {param.documentation || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {entry.returnType && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Returns</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <code className="font-mono text-sm text-primary">{entry.returnType.text}</code>
          </div>
        </div>
      )}

      {entry.documentation?.examples && entry.documentation.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Examples</h2>
          <div className="space-y-6">
            {entry.documentation.examples.map((example, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Example {index + 1}</h3>
                <CodeBlock code={example.code} language={example.language} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
