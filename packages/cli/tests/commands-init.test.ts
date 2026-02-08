import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { registerInit } from '../src/commands/init';
import { createTempDir } from './helpers/temp';

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

import inquirer from 'inquirer';

const mockPrompt = jest.mocked(inquirer.prompt);

const makePromptReturn = (answers: Record<string, unknown>) =>
  Object.assign(Promise.resolve(answers), { ui: {} }) as ReturnType<typeof inquirer.prompt>;

describe('init command', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    mockPrompt.mockImplementation(() =>
      makePromptReturn({
        include: 'src/**/*.ts',
        outputDir: './docs-dist',
        format: 'json',
        primaryColor: '#6366f1',
        darkMode: true,
        search: true,
      })
    );
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

  it('writes JavaScript config with require syntax', async () => {
    const tempDir = await createTempDir('autodocs-init-');
    process.chdir(tempDir);

    const program = new Command();
    registerInit(program);

    await program.parseAsync(['node', 'cli', 'init', '--javascript']);

    const configPath = path.join(tempDir, 'autodocs.config.js');
    const configContent = await fs.readFile(configPath, 'utf-8');
    expect(configContent).toContain("const { defineConfig } = require('@opensyntaxhq/autodocs');");
    expect(configContent).toContain('module.exports = defineConfig(');
  });

  it('validates the primary color prompt', async () => {
    const tempDir = await createTempDir('autodocs-init-');
    process.chdir(tempDir);

    let questions: Array<{ name?: string; validate?: (input: string) => boolean | string }> = [];
    mockPrompt.mockImplementation((qs) => {
      questions = qs as unknown as typeof questions;
      return makePromptReturn({
        include: 'src/**/*.ts',
        outputDir: './docs-dist',
        format: 'json',
        primaryColor: '#6366f1',
        darkMode: true,
        search: true,
      });
    });

    const program = new Command();
    registerInit(program);

    await program.parseAsync(['node', 'cli', 'init', '--json']);

    const colorQuestion = questions.find((q) => q.name === 'primaryColor');
    expect(colorQuestion?.validate?.('#ZZZZZZ')).toBe('Invalid hex color');
    expect(colorQuestion?.validate?.('#abcdef')).toBe(true);
  });

  it('warns when gitignore update fails', async () => {
    const tempDir = await createTempDir('autodocs-init-');
    process.chdir(tempDir);

    const realWriteFile = fs.writeFile;
    const writeFileSpy = jest.spyOn(fs, 'writeFile');
    writeFileSpy.mockImplementationOnce((...args) => realWriteFile(...args));
    writeFileSpy.mockImplementationOnce(() => Promise.reject(new Error('fail')));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as never);

    const program = new Command();
    registerInit(program);

    await program.parseAsync(['node', 'cli', 'init', '--json']);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not update .gitignore'));
    expect(exitSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits when config write fails', async () => {
    const tempDir = await createTempDir('autodocs-init-');
    process.chdir(tempDir);

    jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('fail'));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    const program = new Command();
    registerInit(program);

    await expect(program.parseAsync(['node', 'cli', 'init', '--json'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });
});
