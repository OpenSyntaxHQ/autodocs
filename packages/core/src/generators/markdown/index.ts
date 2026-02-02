import fs from 'fs/promises';
import path from 'path';
import { DocEntry } from '../../extractor';

export async function generateMarkdown(docs: DocEntry[], outputDir: string): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Generate README
  await generateReadme(docs, outputDir);

  // Generate API docs
  await generateApiDocs(docs, outputDir);

  // Generate index
  await generateIndexMd(docs, outputDir);
}

async function generateReadme(docs: DocEntry[], outputDir: string): Promise<void> {
  let md = '# API Documentation\n\n';
  md += `Generated on ${new Date().toLocaleDateString()}\n\n`;
  md += `Total entries: ${docs.length.toString()}\n\n`;

  // Group by kind
  const byKind: Record<string, DocEntry[]> = {};
  docs.forEach((d) => {
    if (!byKind[d.kind]) {
      byKind[d.kind] = [];
    }
    const list = byKind[d.kind];
    if (list) {
      list.push(d);
    }
  });

  md += '## Contents\n\n';
  for (const [kind, entries] of Object.entries(byKind)) {
    md += `- [${capitalize(kind)}s](#${kind}s) (${entries.length.toString()})\n`;
  }
  md += '\n';

  await fs.writeFile(path.join(outputDir, 'README.md'), md, 'utf-8');
}

async function generateApiDocs(docs: DocEntry[], outputDir: string): Promise<void> {
  // Group by kind
  const byKind: Record<string, DocEntry[]> = {};
  docs.forEach((d) => {
    if (!byKind[d.kind]) {
      byKind[d.kind] = [];
    }
    const list = byKind[d.kind];
    if (list) {
      list.push(d);
    }
  });

  for (const [kind, entries] of Object.entries(byKind)) {
    const kindDir = path.join(outputDir, 'api', kind);
    await fs.mkdir(kindDir, { recursive: true });

    for (const entry of entries) {
      const md = generateEntryMarkdown(entry);
      await fs.writeFile(path.join(kindDir, `${entry.name}.md`), md, 'utf-8');
    }
  }
}

function generateEntryMarkdown(entry: DocEntry): string {
  let md = '';

  // Front matter
  md += '---\n';
  md += `title: ${entry.name}\n`;
  md += `kind: ${entry.kind}\n`;
  md += '---\n\n';

  // Title
  md += `# ${entry.name}\n\n`;

  // Description
  if (entry.documentation?.summary) {
    md += `${entry.documentation.summary}\n\n`;
  }

  // Signature
  md += '## Signature\n\n';
  md += '```typescript\n';
  md += entry.signature + '\n';
  md += '```\n\n';

  // Type parameters
  if (entry.typeParameters && entry.typeParameters.length > 0) {
    md += '## Type Parameters\n\n';
    md += '| Name | Constraint | Default |\n';
    md += '|------|------------|----------|\n';
    entry.typeParameters.forEach((tp) => {
      md += `| ${tp.name} | ${tp.constraint || '-'} | ${tp.default || '-'} |\n`;
    });
    md += '\n';
  }

  // Members
  if (entry.members && entry.members.length > 0) {
    md += '## Properties\n\n';
    md += '| Name | Type | Optional | Readonly | Description |\n';
    md += '|------|------|----------|----------|-------------|\n';
    entry.members.forEach((m) => {
      md += `| \`${m.name}\` | \`${m.type}\` | ${m.optional ? 'Yes' : 'No'} | ${
        m.readonly ? 'Yes' : 'No'
      } | ${m.documentation || '-'} |\n`;
    });
    md += '\n';
  }

  // Parameters
  if (entry.parameters && entry.parameters.length > 0) {
    md += '## Parameters\n\n';
    md += '| Name | Type | Optional | Default | Description |\n';
    md += '|------|------|----------|---------|-------------|\n';
    entry.parameters.forEach((p) => {
      md += `| \`${p.name}\` | \`${p.type}\` | ${p.optional ? 'Yes' : 'No'} | ${
        p.defaultValue || '-'
      } | ${p.documentation || '-'} |\n`;
    });
    md += '\n';
  }

  // Return type
  if (entry.returnType) {
    md += '## Returns\n\n';
    md += `\`${entry.returnType.text}\`\n\n`;
  }

  // Examples
  if (entry.documentation?.examples && entry.documentation.examples.length > 0) {
    md += '## Examples\n\n';
    entry.documentation.examples.forEach((ex) => {
      const code = ex.code.replace(/^```\w*\n/, '').replace(/\n```$/, '');
      md += `\`\`\`${ex.language}\n`;
      md += code + '\n';
      md += '```\n\n';
    });
  }

  // Source
  md += '## Source\n\n';
  md += `File: \`${entry.fileName}\`\n`;
  md += `Line: ${entry.position.line.toString()}\n\n`;

  return md;
}

async function generateIndexMd(docs: DocEntry[], outputDir: string): Promise<void> {
  let md = '# API Index\n\n';

  // Group by kind
  const byKind: Record<string, DocEntry[]> = {};
  docs.forEach((d) => {
    if (!byKind[d.kind]) {
      byKind[d.kind] = [];
    }
    const list = byKind[d.kind];
    if (list) {
      list.push(d);
    }
  });

  for (const [kind, entries] of Object.entries(byKind)) {
    md += `## ${capitalize(kind)}s\n\n`;
    entries.sort((a, b) => a.name.localeCompare(b.name));
    entries.forEach((e) => {
      md += `- [\`${e.name}\`](./api/${kind}/${e.name}.md)`;
      if (e.documentation?.summary) {
        md += ` - ${e.documentation.summary.split('\n')[0] || ''}`;
      }
      md += '\n';
    });
    md += '\n';
  }

  await fs.writeFile(path.join(outputDir, 'API_INDEX.md'), md, 'utf-8');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
