import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class LambdaURLHandler extends InputHandler {
  static isLambdaURL(input: unknown): boolean {
    const i = input as Record<string, unknown>;
    if (!i?.requestContext) return false;
    const ctx = i.requestContext as Record<string, unknown>;
    if (!ctx?.http) return false;
    const http = ctx.http as Record<string, unknown>;
    if (!http?.method) return false;
    if (!http?.path) return false;
    return true;
  }

  constructor(input: Record<string, unknown>) {
    super('lambda_url');
    const ctx = input.requestContext as Record<string, Record<string, unknown>>;
    this._method = ctx.http.method as string;
    this._params = (input.queryStringParameters as Record<string, unknown>) || {};

    this._payload = input.body;
    try {
      this._payload = JSON.parse(this._payload as string);
    } catch {
      // keep raw body
    }

    let path = ctx.http.path as string;
    if (path[0] === '/') path = path.substring(1);
    const pos = path.lastIndexOf('.');
    if (pos > 0) {
      this._format = path.substring(pos + 1);
      path = path.substring(0, pos);
    } else {
      this._format = 'json';
    }
    this._path = path.split('/');
    this._headers = (input.headers as Record<string, string>) || {};
  }

  shortInputLog(input: unknown): string {
    const i = input as Record<string, unknown>;
    const ctx = i.requestContext as Record<string, Record<string, unknown>> | undefined;
    return JSON.stringify({
      path: ctx?.http?.path,
      method: ctx?.http?.method,
      params: i.queryStringParameters,
      sourceIp: ctx?.http?.sourceIp,
    });
  }

  processResponse(response: Response, headers: Record<string, string> = {}): unknown {
    const outHeaders: Record<string, string> = {
      ...headers,
      'Content-Type': response.contentType,
      'Access-Control-Allow-Origin': '*',
    };
    const body =
      response.contentType === 'application/json'
        ? JSON.stringify(response.content)
        : String(response.content);
    return {
      statusCode: response.returnCode,
      headers: outHeaders,
      body,
    };
  }
}
