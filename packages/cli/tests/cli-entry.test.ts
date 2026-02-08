const programMock = {
  name: jest.fn().mockReturnThis(),
  description: jest.fn().mockReturnThis(),
  version: jest.fn().mockReturnThis(),
  parse: jest.fn(),
  outputHelp: jest.fn(),
};

const commandMock = jest.fn(() => programMock);

const registerInit = jest.fn();
const registerBuild = jest.fn();
const registerCheck = jest.fn();
const registerServe = jest.fn();
const registerWatch = jest.fn();

jest.mock('commander', () => ({
  Command: commandMock,
}));

jest.mock('../src/commands/init', () => ({ registerInit }));
jest.mock('../src/commands/build', () => ({ registerBuild }));
jest.mock('../src/commands/check', () => ({ registerCheck }));
jest.mock('../src/commands/serve', () => ({ registerServe }));
jest.mock('../src/commands/watch', () => ({ registerWatch }));

jest.mock('@opensyntaxhq/autodocs-core', () => ({
  VERSION: '0.0.0-test',
}));

describe('cli entrypoint', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.clearAllMocks();
    process.argv = [...originalArgv];
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('registers commands and shows help with no args', async () => {
    process.argv = ['node', 'autodocs'];

    await jest.isolateModulesAsync(async () => {
      await import('../src/index');
    });

    expect(commandMock).toHaveBeenCalled();
    expect(registerInit).toHaveBeenCalledWith(programMock);
    expect(registerBuild).toHaveBeenCalledWith(programMock);
    expect(registerCheck).toHaveBeenCalledWith(programMock);
    expect(registerServe).toHaveBeenCalledWith(programMock);
    expect(registerWatch).toHaveBeenCalledWith(programMock);
    expect(programMock.parse).toHaveBeenCalledWith(process.argv);
    expect(programMock.outputHelp).toHaveBeenCalled();
  });

  it('does not show help when args are provided', async () => {
    process.argv = ['node', 'autodocs', 'build'];

    await jest.isolateModulesAsync(async () => {
      await import('../src/index');
    });

    expect(programMock.outputHelp).not.toHaveBeenCalled();
  });
});
