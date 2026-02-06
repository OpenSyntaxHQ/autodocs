import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { registerServe } from '../src/commands/serve';
import { createTempDir } from './helpers/temp';

const listenMock = jest.fn((_port: number, _host: string, cb: () => void) => {
  cb();
});
const useMock = jest.fn();
const getMock = jest.fn();

const expressMock = Object.assign(
  () => ({
    use: useMock,
    get: getMock,
    listen: listenMock,
  }),
  {
    static: jest.fn(() => 'static-middleware'),
  }
);

jest.mock('express', () => ({
  __esModule: true,
  default: expressMock,
}));

describe('serve command', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
    listenMock.mockClear();
    useMock.mockClear();
    getMock.mockClear();
  });

  it('exits when docs directory is missing', async () => {
    const tempDir = await createTempDir('autodocs-serve-');
    process.chdir(tempDir);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${String(code ?? '')}`);
    }) as never);

    const program = new Command();
    registerServe(program);

    await expect(
      program.parseAsync(['node', 'cli', 'serve', '--docs', './missing'])
    ).rejects.toThrow('exit:1');

    exitSpy.mockRestore();
  });

  it('starts server when docs directory exists', async () => {
    const tempDir = await createTempDir('autodocs-serve-');
    const docsDir = path.join(tempDir, 'docs-dist');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, 'index.html'), '<html></html>', 'utf-8');
    process.chdir(tempDir);

    const program = new Command();
    registerServe(program);

    await program.parseAsync([
      'node',
      'cli',
      'serve',
      '--docs',
      docsDir,
      '--port',
      '4567',
      '--host',
      '127.0.0.1',
    ]);

    expect(listenMock).toHaveBeenCalledWith(4567, '127.0.0.1', expect.any(Function));
  });
});
