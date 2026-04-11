import { describe, it, expect } from 'vitest';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';
import OpenAPI from '../OpenAPI.js';

const makeAPI = () =>
  new APIInterface({
    items: {
      method: 'get',
      summary: 'List items',
      description: 'Returns all items',
      tag: 'Items',
      action: async () => new ResponseJSON([]),
    },
    create: {
      method: 'post',
      body: { properties: { name: { type: 'string' } } },
      action: async () => new ResponseJSON({}),
    },
  });

describe('OpenAPI.json', () => {
  it('returns a valid OpenAPI 3.0 document', async () => {
    const doc = await new OpenAPI(makeAPI(), 'Test API', '1.0.0', '/', {}).json();
    expect(doc['openapi']).toBe('3.0.0');
    expect(doc['info']['title']).toBe('Test API');
    expect(doc['info']['version']).toBe('1.0.0');
  });

  it('includes paths for each schema node', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    expect(doc['paths']['/items']).toBeDefined();
    expect(doc['paths']['/create']).toBeDefined();
  });

  it('uses declared HTTP method as key', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    expect(doc['paths']['/items']['get']).toBeDefined();
    expect(doc['paths']['/create']['post']).toBeDefined();
  });

  it('includes requestBody when body defined', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    expect(doc['paths']['/create']['post']['requestBody']).toBeDefined();
  });

  it('includes securitySchemes component', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    expect(doc['components']['securitySchemes']).toBeDefined();
  });
});
