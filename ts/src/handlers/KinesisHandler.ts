import { InputHandler } from './inputHandler.js';

export class KinesistHandler extends InputHandler {
  static isKinesis(input: any): boolean {
    const i = input as Record<string, any[]>;
    return (i.Records?.[0] as Record<string, any>)?.eventSource === 'aws:kinesis';
  }

  static readonly identifier = '__kinesis__';

  constructor(input: any) {
    super(KinesistHandler.identifier);
    this._path = [KinesistHandler.identifier];
    this._method = 'post';
    this._params = {};
    this._payload = input;
    this._format = 'json';
  }

  shortInputLog(input: any): string {
    return JSON.stringify(input);
  }
}
