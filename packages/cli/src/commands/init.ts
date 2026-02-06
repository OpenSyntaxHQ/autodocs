import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';

interface InitAnswers {
  include: string;
  outputDir: string;
  format: string;
  primaryColor: string;
  darkMode: boolean;
  search: boolean;
}

interface InitOptions {
  force?: boolean;
  typescript?: boolean;
  javascript?: boolean;
  json?: boolean;
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Initialize autodocs configuration')
    .option('-f, --force', 'Overwrite existing config')
    .option('--typescript', 'Use TypeScript config (default)', true)
    .option('--javascript', 'Use JavaScript config')
    .option('--json', 'Use JSON config')
    .action(async (options: unknown) => {
      try {
        const opts = options as InitOptions;
        const configType = opts.json ? 'json' : opts.javascript ? 'js' : 'ts';
        const configFile = `autodocs.config.${configType}`;
        const configPath = path.join(process.cwd(), configFile);

        // Check if config exists
        const exists = await fileExists(configPath);

        if (exists && !opts.force) {
          console.log(chalk.yellow(`Config file already exists: ${configFile}`));
          console.log(chalk.yellow('Use --force to overwrite'));
          return;
        }

        // Interactive prompts
        const answers = (await inquirer.prompt([
          {
            type: 'input',
            name: 'include',
            message: 'Source files to document:',
            default: 'src/**/*.ts',
          },
          {
            type: 'input',
            name: 'outputDir',
            message: 'Output directory:',
            default: './docs-dist',
          },
          {
            type: 'list',
            name: 'format',
            message: 'Output format:',
            choices: ['static', 'json', 'markdown'],
            default: 'static',
          },
          {
            type: 'input',
            name: 'primaryColor',
            message: 'Primary color (hex):',
            default: '#6366f1',
            validate: (input: string) => {
              return /^#[0-9A-F]{6}$/i.test(input) || 'Invalid hex color';
            },
          },
          {
            type: 'confirm',
            name: 'darkMode',
            message: 'Enable dark mode?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'search',
            message: 'Enable search?',
            default: true,
          },
        ])) as InitAnswers;

        // Generate config content
        const content = generateConfigContent(answers, configType);

        // Write config file
        await fs.writeFile(configPath, content, 'utf-8');

        console.log(chalk.green(`✓ Created ${configFile}`));

        // Add to .gitignore
        await addToGitignore(answers.outputDir);

        console.log(chalk.cyan('\nNext steps:'));
        console.log(chalk.cyan('  1. Review the configuration file'));
        console.log(chalk.cyan('  2. Run: autodocs build'));
        console.log(chalk.cyan('  3. Run: autodocs serve'));
      } catch (error: unknown) {
        console.error(chalk.red('Error initializing config:'), error);
        process.exit(1);
      }
    });
}

function generateConfigContent(answers: InitAnswers, type: string): string {
  // Safe type casting and validation
  const include = answers.include;
  const outputDir = answers.outputDir;
  const format = answers.format;
  const primaryColor = answers.primaryColor;
  const search = answers.search;
  const darkMode = answers.darkMode;

  const config = {
    include: [include],
    exclude: ['**/*.test.ts', '**/*.spec.ts'],
    output: {
      dir: outputDir,
      format: format,
      clean: true,
    },
    theme: {
      name: 'default',
      primaryColor: primaryColor,
    },
    features: {
      search: search,
      darkMode: darkMode,
      examples: true,
    },
  };

  if (type === 'json') {
    return JSON.stringify(config, null, 2);
  }

  const importLine =
    type === 'ts'
      ? "import { defineConfig } from '@opensyntaxhq/autodocs';"
      : "const { defineConfig } = require('@opensyntaxhq/autodocs');";

  const exportLine = type === 'ts' ? 'export default' : 'module.exports =';

  return `${importLine}

${exportLine} defineConfig(${JSON.stringify(config, null, 2)});
`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function addToGitignore(outputDir: string): Promise<void> {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  try {
    let content = '';

    try {
      content = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // .gitignore doesn't exist, create it
    }

    if (!content.includes(outputDir)) {
      content += `\n# Autodocs\n${outputDir}\n.autodocs-cache\n`;
      await fs.writeFile(gitignorePath, content, 'utf-8');
      console.log(chalk.green(`✓ Added ${outputDir} to .gitignore`));
    }
  } catch {
    console.warn(chalk.yellow('Could not update .gitignore'));
  }
}
