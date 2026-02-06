import { EventEmitter } from 'events';

const closeMock = jest.fn();
const emitter = new EventEmitter() as EventEmitter & { close: () => Promise<void> };
emitter.close = () => {
  closeMock();
  return Promise.resolve();
};

jest.mock('chokidar', () => ({
  watch: jest.fn(() => emitter),
}));

import { FileWatcher } from '../src/utils/watcher';

describe('FileWatcher', () => {
  beforeEach(() => {
    closeMock.mockClear();
  });

  it('emits change events with debounce', () => {
    jest.useFakeTimers();
    const watcher = new FileWatcher({ paths: ['src'], debounce: 50 });
    const handler = jest.fn();
    watcher.on('change', handler);

    watcher.start();
    emitter.emit('change', 'src/index.ts');

    jest.advanceTimersByTime(40);
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(20);
    expect(handler).toHaveBeenCalledWith('src/index.ts');

    jest.useRealTimers();
  });

  it('stops the underlying watcher', async () => {
    const watcher = new FileWatcher({ paths: ['src'] });
    watcher.start();
    await watcher.stop();
    expect(closeMock).toHaveBeenCalled();
  });
});
