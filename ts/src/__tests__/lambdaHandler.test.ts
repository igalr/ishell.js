import { describe, it, expect, vi } from 'vitest';
import { handleLambdaTrigger } from '../lambdaHandler.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeAPI = () =>
  new APIInterface({
    hello: { method: 'get', action: async () => new ResponseJSON({ msg: 'hi' }) },
  });

describe('handleLambdaTrigger', () => {
  it('returns 400 when no handler matches input', async () => {
    const result = await handleLambdaTrigger({}, makeAPI()) as { statusCode: number; body: string };
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Input not recognized');
  });

  it('routes a Lambda URL GET request to the correct handler', async () => {
    const input = {
      requestContext: { http: { method: 'GET', path: '/hello' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    const result = await handleLambdaTrigger(input, makeAPI()) as { statusCode: number; body: string };
    expect(result.statusCode).toBe(200);
    // ResponseJSON now pre-serializes content to a JSON string, and handleLambdaTrigger
    // JSON.stringify()'s it again, so the body is double-encoded.
    expect(JSON.parse(JSON.parse(result.body))).toEqual({ msg: 'hi' });
  });

  it('returns CORS headers for OPTIONS preflight', async () => {
    const input = {
      requestContext: { http: { method: 'OPTIONS', path: '/hello' } },
      queryStringParameters: {},
      body: null,
      headers: {
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'content-type',
      },
    };
    const result = await handleLambdaTrigger(input, makeAPI()) as {
      statusCode: number;
      headers: Record<string, string>;
    };
    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('returns 404 JSON when NotFoundError thrown', async () => {
    const input = {
      requestContext: { http: { method: 'GET', path: '/missing' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    const result = await handleLambdaTrigger(input, makeAPI()) as { statusCode: number; body: string };
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toMatchObject({ type: 'NotFoundError' });
  });
});
