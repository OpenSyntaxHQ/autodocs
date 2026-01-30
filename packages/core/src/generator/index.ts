import fs from 'fs';
import path from 'path';
import { DocEntry } from '../extractor';

export function generateDocs(docs: DocEntry[], outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'autodocs.json');
  fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2));
  console.log(`Documentation generated at ${outputPath}`);
}
