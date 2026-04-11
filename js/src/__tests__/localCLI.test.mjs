import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventEmitter } from 'events';

const mockRl = new EventEmitter();
mockRl.prompt = vi.fn();
mockRl.close = vi.fn();

vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => mockRl),
  },
}));

import { localCLI } from '../localCLI.mjs';
import { APIInterface } from '../API.mjs';
import { ResponseJSON } from '../response.mjs';

const makeAPI = () =>
  new APIInterface({
    hello: { method: 'get', action: async () => new ResponseJSON({ hi: true }) },
  });

afterEach(() => {
  vi.clearAllMocks();
  mockRl.removeAllListeners();
});

describe('localCLI', () => {
  it('calls rl.prompt on start', () => {
    const api = makeAPI();
    void localCLI(api);
    expect(mockRl.prompt).toHaveBeenCalled();
  });

  it('resolves promise when readline closes', async () => {
    const api = makeAPI();
    const done = localCLI(api);
    mockRl.emit('close');
    await expect(done).resolves.toBeUndefined();
  });

  it('ignores empty lines', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const api = makeAPI();
    void localCLI(api);
    mockRl.emit('line', '   ');
    await new Promise(r => setTimeout(r, 10));
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it('closes on exit command', () => {
    const api = makeAPI();
    void localCLI(api);
    mockRl.emit('line', 'exit');
    expect(mockRl.close).toHaveBeenCalled();
  });
});
