import { describe, it, expect } from 'vitest';
import { ConsoleHandler } from '../handlers/console.js';

describe('ConsoleHandler.parse', () => {
  it('parses plain path segments', () => {
    const { path, params, body } = ConsoleHandler.parse('v1 foo');
    expect(path).toEqual(['v1', 'foo']);
    expect(params).toEqual({});
    expect(body).toBeNull();
  });
  it('parses --key value pairs', () => {
    const { path, params } = ConsoleHandler.parse('v1 --page 2 --limit 10');
    expect(path).toEqual(['v1']);
    expect(params).toEqual({ page: '2', limit: '10' });
  });
  it('parses boolean flag (no value)', () => {
    const { params } = ConsoleHandler.parse('v1 --verbose');
    expect(params['verbose']).toBe(true);
  });
  it('parses flag with JSON as value', () => {
    const { path, params } = ConsoleHandler.parse("v1 --body '{ \"x\": 1 }'");
    expect(path).toEqual(['v1']);
    expect(params['body']).toBe('{ "x": 1 }');
  });
  it('parses body after valueless flag', () => {
    const { path, params, body } = ConsoleHandler.parse('v1 --json rawbody');
    expect(path).toEqual(['v1']);
    // Since 'rawbody' is non-flag and follows immediately after --json,
    // it's consumed as the value for --json, not body
    expect(params['json']).toBe('rawbody');
    expect(body).toBeNull();
  });
  it('parses body when no following flag after token', () => {
    const { path, params, body } = ConsoleHandler.parse('v1 --verbose --');
    expect(path).toEqual(['v1']);
    expect(params['verbose']).toBe(true);
    expect(params['']).toBe(true); // '--' becomes a flag with empty key
    expect(body).toBeNull();
  });
  it('handles empty line', () => {
    const { path, params, body } = ConsoleHandler.parse('');
    expect(path).toEqual([]);
    expect(params).toEqual({});
    expect(body).toBeNull();
  });
});

describe('ConsoleHandler', () => {
  it('sets handler type to console', () => {
    const h = new ConsoleHandler(['v1'], {}, 'get', null);
    expect(h.type).toBe('console');
  });
  it('sets _handler_type header', () => {
    const h = new ConsoleHandler(['v1'], {}, 'get', null);
    expect(h.headers['_handler_type']).toBe('console');
  });
});
