import { describe, it, expect } from 'vitest';
import { LambdaSimulatorAPI } from '../LambdaSimulatorAPI.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeTargetAPI = () =>
  new APIInterface({
    hello: { method: 'get', action: async () => new ResponseJSON({ ok: true }) },
  });

describe('LambdaSimulatorAPI', () => {
  it('is an APIInterface', () => {
    const sim = new LambdaSimulatorAPI(makeTargetAPI(), '1.0.0');
    expect(sim.isAPIInterface).toBe(true);
  });
  it('exposes a simulate endpoint', () => {
    const sim = new LambdaSimulatorAPI(makeTargetAPI(), '1.0.0');
    expect(sim.schema['simulate']).toBeDefined();
    expect(sim.schema['simulate'].method).toBe('post');
  });
  it('simulate action invokes handleLambdaTrigger and returns ResponseJSON', async () => {
    const sim = new LambdaSimulatorAPI(makeTargetAPI(), '1.0.0');
    const lambdaInput = {
      requestContext: { http: { method: 'GET', path: '/hello' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    const result = await sim.schema['simulate'].action({}, lambdaInput, {});
    expect(result.contentType).toBe('application/json');
  });
});
