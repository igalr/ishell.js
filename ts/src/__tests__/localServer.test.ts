import { describe, it, expect, afterEach } from 'vitest';
import http from 'http';
import { localServer } from '../localServer.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeAPI = () =>
  new APIInterface({
    ping: { method: 'get', action: async () => new ResponseJSON({ pong: true }) },
    echo: { method: 'post', action: async (_p, body) => new ResponseJSON({ echoed: body }) },
  });

let server: http.Server | null = null;

afterEach(async () => {
  if (server) {
    await new Promise<void>(resolve => server!.close(() => resolve()));
    server = null;
  }
});

const get = (port: number, path: string): Promise<{ status: number; body: string }> =>
  new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    }).on('error', reject);
  });

describe('localServer', () => {
  it('starts and responds to GET requests', async () => {
    process.env.PORT = '19876';
    server = await localServer(makeAPI()) as http.Server;
    const { status, body } = await get(19876, '/ping');
    expect(status).toBe(200);
    expect(JSON.parse(body)).toEqual({ pong: true });
  });

  it('returns 404 JSON for unknown paths', async () => {
    process.env.PORT = '19877';
    server = await localServer(makeAPI()) as http.Server;
    const { status, body } = await get(19877, '/unknown');
    expect(status).toBe(404);
    expect(JSON.parse(body)).toMatchObject({ status: 'error', type: 'NotFoundError' });
  });
});
