import { Command } from 'commander';
import { registerCheck } from '../src/commands/check';
import type { AutodocsConfig } from '../src/config';

jest.mock('ora', () => () => ({
  text: '',
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
}));

jest.mock('../src/config', () => ({
  loadConfig: jest.fn(),
  resolveConfigPaths: jest.fn(),
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  stat: jest.fn(),
}));

import { loadConfig, resolveConfigPaths } from '../src/config';
import { glob } from 'glob';
import fs from 'fs/promises';

const globMock = glob as unknown as jest.MockedFunction<typeof glob>;

describe('check command', () => {
  const baseConfig: AutodocsConfig = {
    include: ['src/**/*.ts'],
    output: { dir: './docs-dist', format: 'json', clean: true },
  } as AutodocsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exits when no config is found', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(null);

    const program = new Command();
    registerCheck(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'check'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('exits when no files match include patterns', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);
    globMock.mockResolvedValueOnce([]);
    (fs.stat as jest.Mock).mockRejectedValueOnce(new Error('missing'));

    const program = new Command();
    registerCheck(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'check'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('warns when tsconfig is missing but does not exit', async () => {
    const config: AutodocsConfig = {
      ...baseConfig,
      tsconfig: './tsconfig.json',
    } as AutodocsConfig;

    (loadConfig as jest.Mock).mockResolvedValueOnce(config);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(config);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (fs.access as jest.Mock).mockRejectedValueOnce(new Error('missing'));
    (fs.stat as jest.Mock).mockRejectedValueOnce(new Error('missing'));

    const program = new Command();
    registerCheck(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as never);

    await program.parseAsync(['node', 'cli', 'check']);

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('exits when output path exists but is not a directory', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (fs.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => false });

    const program = new Command();
    registerCheck(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    await expect(program.parseAsync(['node', 'cli', 'check'])).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('completes successfully when no issues are found', async () => {
    (loadConfig as jest.Mock).mockResolvedValueOnce(baseConfig);
    (resolveConfigPaths as jest.Mock).mockReturnValueOnce(baseConfig);
    globMock.mockResolvedValueOnce(['/tmp/example.ts']);
    (fs.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => true });

    const program = new Command();
    registerCheck(program);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as never);

    await program.parseAsync(['node', 'cli', 'check']);

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
