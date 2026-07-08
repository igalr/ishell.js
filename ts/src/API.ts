import type { Response } from './response.js';
import { ResponseJSON } from './response.js';
import OpenAPI from './OpenAPI.js';
import { AuthError, NotFoundError } from './errors.js';

export interface ParamDefinition {
  in?: 'query' | 'path' | 'header';
  type?: string;
  required?: boolean;
  default?: string | number | boolean;
  description?: string;
}

export type ActionResult = Promise<Response | APIInterface>;

export interface SchemaNode {
  method?: string;
  summary?: string;
  description?: string;
  tag?: string;
  api?: boolean;
  toplevel?: boolean;
  params?: Record<string, ParamDefinition>;
  body?: object;
  responses?: Record<string, { description: string }>;
  action: (
    params: Record<string, string | number | boolean>,
    body: object | null,
    headers: Record<string, string>
  ) => ActionResult;
}

export type Schema = Record<string, SchemaNode>;

export class APIInterface {
  #schema: Schema;
  get schema(): Schema { return this.#schema; }

  readonly #title: string;
  readonly #version: string;

  constructor(schema: Schema = {}, title = 'API Documentation', version = 'Unknown') {
    this.#schema = this.#restrictSchema(schema);
    this.#title = `${title} (${process.env.AWS_LAMBDA_FUNCTION_NAME || 'Local'})`;
    this.#version = version;
  }

  get isAPIInterface(): boolean { return true; }

  async execute(
    path: string | string[],
    params: Record<string, string | number | boolean>,
    methods: string,
    body: object | null,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    if (!Array.isArray(path)) path = [path];
    const pathinit = path.join('/');
    const node = await this.exrec([...path], params, methods, body, headers);
    if ((node as APIInterface)?.isAPIInterface === true) {
      return (node as APIInterface).usage(pathinit, this.#schema[pathinit]?.params);
    }
    return node as Response;
  }

  async exrec(
    path: string[],
    params: Record<string, string | number | boolean>,
    _methods: string,
    body: object | null,
    headers: Record<string, string> = {}
  ): Promise<Response | APIInterface> {
    let currentAPI: APIInterface = this;
    while (path.length > 0) {
      const pathElement = path.splice(0, 1)[0];
      const schemaNode = currentAPI.#schema[pathElement];
      if (!schemaNode) throw new NotFoundError(pathElement + ' not found');

      if (schemaNode.params && Object.keys(schemaNode.params).length > 0) {
        for (const key of Object.keys(schemaNode.params)) {
          if (schemaNode.params[key]?.in === 'path') {
            params[key] = path.splice(0, 1)[0];
          }
        }
      }
      const result = await schemaNode.action(params, body, headers);
      if (path.length === 0) return result;
      if (!(result instanceof APIInterface)) {
        throw new NotFoundError(pathElement + ' not found');
      }
      currentAPI = result;
    }
    return currentAPI;
  }

  async usage(path: string, params: Record<string, ParamDefinition> = {}): Promise<Response> {
    const d = await new OpenAPI(this, this.#title, this.#version, path, params).json();
    return new ResponseJSON(d);
  }

  addHandler(key: string, handler: SchemaNode['action']): void {
    this.#schema[key] = {
      method: 'post',
      action: handler,
    };
  }

  addLambdaSimulator(simulator: () => Promise<APIInterface>): void {
    const allowList = process.env.ALLOW_API?.split(',').map(s => s.trim()) || ['all'];
    const denyList = process.env.DENY_API?.split(',').map(s => s.trim()) || [];
    if (denyList.indexOf('lambda') >= 0) return;
    if (allowList.indexOf('all') < 0 && allowList.indexOf('lambda') < 0) return;
    this.#schema['lambda'] = {
      api: true,
      toplevel: true,
      tag: 'Lambda Simulator',
      description: 'Simulate Lambda invocation using REST API',
      action: simulator,
    };
  }

  #restrictSchema(schema: Schema): Schema {
    const allowList = process.env.ALLOW_API?.split(',').map(s => s.trim()) || null;
    const denyList = process.env.DENY_API?.split(',').map(s => s.trim()) || [];
    if (denyList[0]?.toLowerCase() === 'all') return {};
    for (const key of Object.keys(schema)) {
      if (schema[key].api && schema[key].toplevel) {
        if ((allowList && allowList.indexOf(key) < 0) || denyList.indexOf(key) >= 0) {
          delete schema[key];
        }
      }
    }
    return schema;
  }

  async resolveMethod(path: string | string[]): Promise<string> {
    if (!Array.isArray(path)) path = [path];
    path = [...path];
    let currentSchema = this.#schema;
    let method = 'get';
    for (let i = 0; i < path.length; i++) {
      const node = currentSchema[path[i]];
      if (!node) return method;
      if (node.method) method = node.method;
      if (i < path.length - 1 && node.action) {
        try {
          const next = await node.action({}, null, {});
          if ((next as APIInterface)?.isAPIInterface) {
            currentSchema = (next as APIInterface).schema;
          } else {
            return method;
          }
        } catch {
          return method;
        }
      }
    }
    return method;
  }

  confirmAPIKey(headers: Record<string, string>, apiKey: string | undefined): void {
    if (apiKey) {
      const provided = headers['x-api-key'];
      if (!provided || provided !== apiKey) {
        throw new AuthError('Invalid or missing API key');
      }
    }
  }
}
