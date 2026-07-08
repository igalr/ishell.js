import { InputHandler } from './inputHandler.js';
import { ResponseJSON, type Response } from '../response.js';

export class LambdaURLHandler extends InputHandler {
  static isLambdaURL(input: any): boolean {
    const i = input as Record<string, any>;
    if (!i?.requestContext) return false;
    const ctx = i.requestContext as Record<string, any> | undefined;
    if (!ctx?.http) return false;
    const http = ctx.http as Record<string, any>;
    if (!http?.method) return false;
    if (!http?.path) return false;
    return true;
  }

  constructor(input: Record<string, any>) {
    super('lambda_url');
    const ctx = input.requestContext as Record<string, Record<string, any>>;
    this._method = ctx.http.method as string;
    this._params = (input.queryStringParameters as Record<string, string | number | boolean>) || {};

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

  shortInputLog(input: any): string {
    const i = input as Record<string, any>;
    const ctx = i.requestContext as Record<string, Record<string, any>> | undefined;
    return JSON.stringify({
      path: ctx?.http?.path,
      method: ctx?.http?.method,
      params: i.queryStringParameters,
      sourceIp: ctx?.http?.sourceIp,
    });
  }

  processResponse(response: Response, headers: Record<string, string> = {}): Response {
    const outHeaders: Record<string, string> = {
      ...headers,
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
    };
    return response.withHeaders(outHeaders);
  }
}
