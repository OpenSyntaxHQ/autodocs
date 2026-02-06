import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { registerInit } from '../src/commands/init';
import { createTempDir } from './helpers/temp';

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

import inquirer from 'inquirer';

const mockPrompt = inquirer.prompt as jest.Mock;

describe('init command', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    mockPrompt.mockResolvedValue({
      include: 'src/**/*.ts',
      outputDir: './docs-dist',
      format: 'json',
      primaryColor: '#6366f1',
      darkMode: true,
      search: true,
    });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
  });

  it('creates config file and updates gitignore', async () => {
    const tempDir = await createTempDir('autodocs-init-');
    process.chdir(tempDir);

    const program = new Command();
    registerInit(program);

    await program.parseAsync(['node', 'cli', 'init', '--json']);

    const configPath = path.join(tempDir, 'autodocs.config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    expect(configContent).toContain('"format": "json"');

    const gitignorePath = path.join(tempDir, '.gitignore');
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    expect(gitignoreContent).toContain('docs-dist');
    expect(gitignoreContent).toContain('.autodocs-cache');
  });

  it('does not overwrite existing config without --force', async () => {
    const tempDir = await createTempDir('autodocs-init-');
    process.chdir(tempDir);

    const configPath = path.join(tempDir, 'autodocs.config.json');
    await fs.writeFile(configPath, 'existing', 'utf-8');

    const program = new Command();
    registerInit(program);

    await program.parseAsync(['node', 'cli', 'init', '--json']);

    const configContent = await fs.readFile(configPath, 'utf-8');
    expect(configContent).toBe('existing');
  });
});
