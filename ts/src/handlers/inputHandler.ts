import type { Response } from '../response.js';

export abstract class InputHandler {
  readonly #type: string;
  get type(): string { return this.#type; }

  protected _path: string[] = [];
  protected _method: string = '';
  protected _params: Record<string, string | number | boolean> = {};
  protected _payload: any = null;
  protected _format: string = 'json';
  protected _headers: Record<string, string> = {};

  get path(): string[] { return this._path; }
  get method(): string { return this._method; }
  get params(): Record<string, string | number | boolean> { return this._params; }
  get payload(): any { return this._payload; }
  get format(): string { return this._format; }
  get headers(): Record<string, string> { return this._headers; }

  constructor(type: string) {
    this.#type = type;
  }

  getParam(key: string): string | number | boolean | undefined {
    return this._params[key];
  }

  processResponse(response: Response, headers: Record<string, string>): Response {
    return response;
  }

  shortInputLog(input: any): string {
    let s = JSON.stringify(input);
    if (s.length > 100) s = s.substring(0, 100) + '...';
    return s;
  }

  get json(): Record<string, any> {
    return {
      type: this.#type,
      method: this._method,
      path: this._path,
      params: this._params,
      payload: this._payload,
      format: this._format,
    };
  }
}
