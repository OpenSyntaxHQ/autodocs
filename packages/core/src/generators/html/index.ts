import fs from 'fs/promises';
import path from 'path';
import { DocEntry, Member, Parameter, CodeExample } from '../../extractor';

export async function generateHtml(docs: DocEntry[], outputDir: string): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Generate index page
  await generateIndexPage(docs, outputDir);

  // Generate detail pages
  await generateDetailPages(docs, outputDir);

  // Copy assets
  await copyAssets(outputDir);
}

async function generateIndexPage(docs: DocEntry[], outputDir: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="./assets/styles.css">
</head>
<body>
  <header>
    <h1>API Documentation</h1>
  </header>
  
  <main>
    <div class="stats">
      <p>Total entries: ${docs.length.toString()}</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    ${generateGroupedList(docs)}
  </main>
  
  <script src="./assets/main.js"></script>
</body>
</html>`;

  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf-8');
}

function generateGroupedList(docs: DocEntry[]): string {
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

  let html = '';

  for (const [kind, entries] of Object.entries(byKind)) {
    html += `<section>
      <h2>${capitalize(kind)}s (${entries.length.toString()})</h2>
      <ul>`;

    entries.sort((a, b) => a.name.localeCompare(b.name));
    entries.forEach((e) => {
      html += `<li>
        <a href="./api/${kind}/${e.name}.html">
          <code>${e.name}</code>
        </a>`;

      if (e.documentation?.summary) {
        html += `<p>${escapeHtml(e.documentation.summary)}</p>`;
      }

      html += `</li>`;
    });

    html += `</ul></section>`;
  }

  return html;
}

async function generateDetailPages(docs: DocEntry[], outputDir: string): Promise<void> {
  for (const entry of docs) {
    const html = generateDetailPage(entry);
    const dir = path.join(outputDir, 'api', entry.kind);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${entry.name}.html`), html, 'utf-8');
  }
}

function generateDetailPage(entry: DocEntry): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entry.name} - API Documentation</title>
  <link rel="stylesheet" href="../../assets/styles.css">
</head>
<body>
  <header>
    <a href="../../index.html">← Back to Index</a>
    <h1>${entry.name}</h1>
    <span class="badge">${entry.kind}</span>
  </header>
  
  <main>
    ${entry.documentation?.summary ? `<p class="description">${escapeHtml(entry.documentation.summary)}</p>` : ''}
    
    <section>
      <h2>Signature</h2>
      <pre><code>${escapeHtml(entry.signature)}</code></pre>
    </section>
    
    ${entry.members && entry.members.length > 0 ? generateMembersSection(entry.members) : ''}
    ${entry.parameters && entry.parameters.length > 0 ? generateParametersSection(entry.parameters) : ''}
    ${entry.returnType ? `<section><h2>Returns</h2><code>${escapeHtml(entry.returnType.text)}</code></section>` : ''}
    ${entry.documentation?.examples ? generateExamplesSection(entry.documentation.examples) : ''}
    
    <section>
      <h2>Source</h2>
      <p>File: <code>${escapeHtml(entry.fileName)}</code></p>
      <p>Line: ${entry.position.line.toString()}</p>
    </section>
  </main>
</body>
</html>`;
}

function generateMembersSection(members: Member[]): string {
  return `<section>
    <h2>Properties</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Optional</th>
          <th>Readonly</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${members
          .map(
            (m) => `
        <tr>
          <td><code>${escapeHtml(m.name)}</code></td>
          <td><code>${escapeHtml(m.type)}</code></td>
          <td>${m.optional ? 'Yes' : 'No'}</td>
          <td>${m.readonly ? 'Yes' : 'No'}</td>
          <td>${m.documentation ? escapeHtml(m.documentation) : '-'}</td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </section>`;
}

function generateParametersSection(parameters: Parameter[]): string {
  return `<section>
    <h2>Parameters</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Optional</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${parameters
          .map(
            (p) => `
        <tr>
          <td><code>${escapeHtml(p.name)}</code></td>
          <td><code>${escapeHtml(p.type)}</code></td>
          <td>${p.optional ? 'Yes' : 'No'}</td>
          <td>${p.documentation ? escapeHtml(p.documentation) : '-'}</td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </section>`;
}

function generateExamplesSection(examples: CodeExample[]): string {
  return `<section>
    <h2>Examples</h2>
    ${examples
      .map((ex) => {
        const code = ex.code.replace(/^```\w*\n/, '').replace(/\n```$/, '');
        return `<pre><code class="language-${ex.language}">${escapeHtml(code)}</code></pre>`;
      })
      .join('')}
  </section>`;
}

async function copyAssets(outputDir: string): Promise<void> {
  const assetsDir = path.join(outputDir, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });

  // Simple CSS
  const css = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
header { background: #6366f1; color: white; padding: 1rem 2rem; }
header h1 { font-size: 1.5rem; }
header a { color: white; text-decoration: none; }
main { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
section { margin: 2rem 0; }
h2 { margin: 1rem 0; color: #6366f1; }
code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: 'Courier New', monospace; }
pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
pre code { background: none; color: inherit; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
th { background: #f5f5f5; font-weight: 600; }
.badge { background: #8b5cf6; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.875rem; }
.stats { background: #f5f5f5; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
ul { list-style: none; }
li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
li a { color: #6366f1; text-decoration: none; font-weight: 500; }
li a:hover { text-decoration: underline; }
.description { font-size: 1.125rem; color: #666; margin: 1rem 0; }
  `;

  await fs.writeFile(path.join(assetsDir, 'styles.css'), css, 'utf-8');

  // Simple JS
  const js = `console.log('Autodocs loaded');`;
  await fs.writeFile(path.join(assetsDir, 'main.js'), js, 'utf-8');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}
