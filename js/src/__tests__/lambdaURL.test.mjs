import { describe, it, expect } from 'vitest';
import { LambdaURLHandler } from '../../handlers/lambdaURL.mjs';
import { ResponseJSON } from '../../response.mjs';

const makeInput = (path, method = 'GET', query = {}, body = null) => ({
  requestContext: { http: { method, path } },
  queryStringParameters: query,
  body,
  headers: { 'content-type': 'application/json' },
});

describe('LambdaURLHandler.isLambdaURL', () => {
  it('returns true for valid Lambda URL input', () => {
    expect(LambdaURLHandler.isLambdaURL(makeInput('/v1/foo'))).toBe(true);
  });
  it('returns false when requestContext missing', () => {
    expect(LambdaURLHandler.isLambdaURL({})).toBe(false);
  });
  it('returns false when http missing', () => {
    expect(LambdaURLHandler.isLambdaURL({ requestContext: {} })).toBe(false);
  });
  it('returns false when method missing', () => {
    expect(LambdaURLHandler.isLambdaURL({ requestContext: { http: { path: '/x' } } })).toBe(false);
  });
});

describe('LambdaURLHandler', () => {
  it('parses path segments', () => {
    const h = new LambdaURLHandler(makeInput('/v1/foo/bar'));
    expect(h.path).toEqual(['v1', 'foo', 'bar']);
    expect(h.method).toBe('GET');
  });
  it('strips leading slash', () => {
    const h = new LambdaURLHandler(makeInput('/hello'));
    expect(h.path).toEqual(['hello']);
  });
  it('strips file extension and sets format', () => {
    const h = new LambdaURLHandler(makeInput('/v1/report.csv'));
    expect(h.path).toEqual(['v1', 'report']);
    expect(h.format).toBe('csv');
  });
  it('defaults format to json when no extension', () => {
    const h = new LambdaURLHandler(makeInput('/v1/data'));
    expect(h.format).toBe('json');
  });
  it('parses JSON body', () => {
    const h = new LambdaURLHandler(makeInput('/x', 'POST', {}, '{"key":"val"}'));
    expect(h.payload).toEqual({ key: 'val' });
  });
  it('keeps raw body when not valid JSON', () => {
    const h = new LambdaURLHandler(makeInput('/x', 'POST', {}, 'raw text'));
    expect(h.payload).toBe('raw text');
  });
  it('processResponse returns Lambda-shaped object', () => {
    const h = new LambdaURLHandler(makeInput('/x'));
    const resp = new ResponseJSON({ ok: true });
    const out = h.processResponse(resp);
    expect(out.statusCode).toBe(200);
    expect(JSON.parse(out.body)).toEqual({ ok: true });
    expect(out.headers['Content-Type']).toBe('application/json');
  });
});
