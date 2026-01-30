import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';

export function registerInit(program: Command) {
  program
    .command('init')
    .description('Initialize a new autodocs configuration')
    .action(() => {
      const configPath = path.join(process.cwd(), 'autodocs.config.ts');
      
      if (fs.existsSync(configPath)) {
        console.log(chalk.yellow('Config file already exists.'));
        return;
      }

      const content = `import { defineConfig } from '@opensyntaxhq/autodocs';

export default defineConfig({
  include: ['src/**/*.ts'],
  output: {
    dir: './docs-dist',
  }
});
`;
      fs.writeFileSync(configPath, content);
      console.log(chalk.green('Created autodocs.config.ts'));
    });
}
