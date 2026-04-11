import { describe, it, expect } from 'vitest';
import { InputHandler } from '../handlers/inputHandler.js';

class TestHandler extends InputHandler {
  constructor() {
    super('test-type');
    this._path = ['a', 'b'];
    this._method = 'GET';
    this._params = { key: 'val' };
    this._payload = { data: 1 };
    this._format = 'json';
    this._headers = { 'x-custom': 'yes' };
  }
}

describe('InputHandler', () => {
  it('exposes type via getter', () => {
    expect(new TestHandler().type).toBe('test-type');
  });
  it('exposes path, method, params, payload, format, headers', () => {
    const h = new TestHandler();
    expect(h.path).toEqual(['a', 'b']);
    expect(h.method).toBe('GET');
    expect(h.params).toEqual({ key: 'val' });
    expect(h.payload).toEqual({ data: 1 });
    expect(h.format).toBe('json');
    expect(h.headers).toEqual({ 'x-custom': 'yes' });
  });
  it('getParam returns value for key', () => {
    expect(new TestHandler().getParam('key')).toBe('val');
  });
  it('shortInputLog truncates long input to ~103 chars', () => {
    const h = new TestHandler();
    const log = h.shortInputLog({ data: 'x'.repeat(200) });
    expect(log.length).toBeLessThanOrEqual(103);
    expect(log.endsWith('...')).toBe(true);
  });
  it('shortInputLog returns full string when short', () => {
    const h = new TestHandler();
    const log = h.shortInputLog({ x: 1 });
    expect(log).toBe('{"x":1}');
  });
  it('json getter returns structured object', () => {
    const h = new TestHandler();
    expect(h.json).toMatchObject({
      type: 'test-type',
      method: 'GET',
      path: ['a', 'b'],
      params: { key: 'val' },
      format: 'json',
    });
  });
});
