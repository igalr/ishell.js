import { describe, it, expect } from 'vitest';
import { ExpressURLHandler } from '../handlers/express.js';
import { ResponseJSON } from '../response.js';

const makeInput = (path: string, method = 'GET') => ({
  method,
  requestContext: { http: { path } },
  query: { page: '1' },
  body: '{"x":1}',
  headers: { authorization: 'Bearer tok' },
});

describe('ExpressURLHandler.isExpressURL', () => {
  it('returns true for valid express input', () => {
    expect(ExpressURLHandler.isExpressURL(makeInput('/v1/foo'))).toBe(true);
  });
  it('returns false when method missing', () => {
    expect(ExpressURLHandler.isExpressURL({ requestContext: { http: { path: '/x' } } })).toBe(false);
  });
  it('returns false when requestContext missing', () => {
    expect(ExpressURLHandler.isExpressURL({ method: 'GET' })).toBe(false);
  });
});

describe('ExpressURLHandler', () => {
  it('parses path and strips leading slash', () => {
    const h = new ExpressURLHandler(makeInput('/v1/data'));
    expect(h.path).toEqual(['v1', 'data']);
  });
  it('strips extension and sets format', () => {
    const h = new ExpressURLHandler(makeInput('/v1/report.csv'));
    expect(h.path).toEqual(['v1', 'report']);
    expect(h.format).toBe('csv');
  });
  it('parses query params', () => {
    const h = new ExpressURLHandler(makeInput('/v1/data'));
    expect(h.params).toEqual({ page: '1' });
  });
  it('parses JSON body', () => {
    const h = new ExpressURLHandler(makeInput('/v1/data', 'POST'));
    expect(h.payload).toEqual({ x: 1 });
  });
  it('processResponse returns Lambda-shaped object', () => {
    const h = new ExpressURLHandler(makeInput('/x'));
    const resp = new ResponseJSON({ ok: true });
    const out = h.processResponse(resp, {}) as { statusCode: number; body: string; headers: Record<string, string> };
    expect(out.statusCode).toBe(200);
    expect(out.headers['Content-Type']).toBe('application/json');
  });
});
