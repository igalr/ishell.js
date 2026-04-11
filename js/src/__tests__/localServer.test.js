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

let server = null;

afterEach(async () => {
  if (server) {
    await new Promise(resolve => server.close(() => resolve()));
    server = null;
  }
});

const get = (port, path) =>
  new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    }).on('error', reject);
  });

describe('localServer', () => {
  it('starts and responds to GET requests', async () => {
    process.env.PORT = '19878';
    server = await localServer(makeAPI());
    const { status, body } = await get(19878, '/ping');
    expect(status).toBe(200);
    expect(JSON.parse(body)).toEqual({ pong: true });
  });

  it('returns 404 JSON for unknown paths', async () => {
    process.env.PORT = '19879';
    server = await localServer(makeAPI());
    const { status, body } = await get(19879, '/unknown');
    expect(status).toBe(404);
    expect(JSON.parse(body)).toMatchObject({ status: 'error', type: 'NotFoundError' });
  });
});
