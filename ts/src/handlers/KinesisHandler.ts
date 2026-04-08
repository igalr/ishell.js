import { InputHandler } from './inputHandler.js';

export class KinesistHandler extends InputHandler {
  static isKinesis(input: unknown): boolean {
    const i = input as Record<string, unknown[]>;
    return (i.Records?.[0] as Record<string, unknown>)?.eventSource === 'aws:kinesis';
  }

  static readonly identifier = '__kinesis__';

  constructor(input: unknown) {
    super(KinesistHandler.identifier);
    this._path = KinesistHandler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = input;
    this._format = 'json';
  }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }
}
