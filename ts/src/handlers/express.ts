import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class ExpressURLHandler extends InputHandler {
  static isExpressURL(input: unknown): boolean {
    const i = input as Record<string, unknown>;
    if (!i?.method) return false;
    if (!i?.requestContext) return false;
    const ctx = i.requestContext as Record<string, unknown>;
    if (!ctx?.http) return false;
    const http = ctx.http as Record<string, unknown>;
    if (!http?.path) return false;
    return true;
  }

  constructor(input: Record<string, unknown>) {
    super('express');
    this._method = input.method as string;
    this._params = (input.query as Record<string, unknown>) || {};

    this._payload = input.body;
    try {
      this._payload = JSON.parse(this._payload as string);
    } catch {
      // keep raw body
    }

    const ctx = input.requestContext as Record<string, Record<string, unknown>>;
    let path = (ctx.http.path as string) || '';
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

  processResponse(response: Response, headers: Record<string, string> = {}): unknown {
    headers['Content-Type'] = response.contentType;
    const body =
      response.contentType === 'application/json'
        ? JSON.stringify(response.content)
        : response.content;
    return {
      statusCode: response.returnCode,
      headers,
      body,
    };
  }
}
