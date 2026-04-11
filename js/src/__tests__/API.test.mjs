import { describe, it, expect, afterEach } from 'vitest';
import { APIInterface } from '../API.mjs';
import { ResponseJSON } from '../response.mjs';
import { NotFoundError, AuthError } from '../errors.mjs';

const makeSimpleAPI = () =>
  new APIInterface({
    hello: {
      method: 'get',
      action: async () => new ResponseJSON({ message: 'world' }),
    },
    greet: {
      method: 'post',
      action: async (_p, body) => new ResponseJSON({ echo: body }),
    },
  });

describe('APIInterface.execute', () => {
  it('resolves a leaf node and returns its response', async () => {
    const api = makeSimpleAPI();
    const r = await api.execute(['hello'], {}, 'GET', null);
    expect(r.contentType).toBe('application/json');
    expect(r.content).toEqual({ message: 'world' });
  });
  it('throws NotFoundError for unknown path', async () => {
    await expect(makeSimpleAPI().execute(['missing'], {}, 'GET', null)).rejects.toThrow(NotFoundError);
  });
  it('passes body to action', async () => {
    const api = makeSimpleAPI();
    const r = await api.execute(['greet'], {}, 'POST', { name: 'Alice' });
    expect(r.content).toEqual({ echo: { name: 'Alice' } });
  });
  it('accepts string path (non-array)', async () => {
    const api = makeSimpleAPI();
    const r = await api.execute('hello', {}, 'GET', null);
    expect(r.content).toEqual({ message: 'world' });
  });
});

describe('APIInterface.addHandler', () => {
  it('registers a new endpoint reachable via execute', async () => {
    const api = makeSimpleAPI();
    api.addHandler('added', async () => new ResponseJSON({ added: true }));
    const r = await api.execute(['added'], {}, 'POST', null);
    expect(r.content).toEqual({ added: true });
  });
});

describe('APIInterface.isAPIInterface', () => {
  it('returns true', () => {
    expect(makeSimpleAPI().isAPIInterface).toBe(true);
  });
});

describe('APIInterface.resolveMethod', () => {
  it('returns the declared method of the terminal node', async () => {
    const api = makeSimpleAPI();
    expect(await api.resolveMethod(['hello'])).toBe('get');
    expect(await api.resolveMethod(['greet'])).toBe('post');
  });
  it('defaults to get when no method declared', async () => {
    const api = new APIInterface({ foo: { action: async () => new ResponseJSON({}) } });
    expect(await api.resolveMethod(['foo'])).toBe('get');
  });
  it('returns get for unknown path', async () => {
    expect(await makeSimpleAPI().resolveMethod(['unknown'])).toBe('get');
  });
});

describe('APIInterface schema restriction', () => {
  afterEach(() => {
    delete process.env.ALLOW_API;
    delete process.env.DENY_API;
  });

  it('exposes all toplevel api nodes by default', () => {
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
      b: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(api.schema['a']).toBeDefined();
    expect(api.schema['b']).toBeDefined();
  });

  it('restricts to ALLOW_API list', () => {
    process.env.ALLOW_API = 'a';
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
      b: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(api.schema['a']).toBeDefined();
    expect(api.schema['b']).toBeUndefined();
  });

  it('blocks nodes in DENY_API list', () => {
    process.env.DENY_API = 'b';
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
      b: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(api.schema['a']).toBeDefined();
    expect(api.schema['b']).toBeUndefined();
  });

  it('returns empty schema when DENY_API=all', () => {
    process.env.DENY_API = 'all';
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(Object.keys(api.schema)).toHaveLength(0);
  });
});

describe('APIInterface.confirmAPIKey', () => {
  it('does not throw when no apiKey configured', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({}, undefined)).not.toThrow();
  });
  it('throws AuthError when key missing', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({}, 'secret')).toThrow(AuthError);
  });
  it('throws AuthError when key wrong', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({ 'x-api-key': 'wrong' }, 'secret')).toThrow(AuthError);
  });
  it('does not throw when key matches', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({ 'x-api-key': 'secret' }, 'secret')).not.toThrow();
  });
});
