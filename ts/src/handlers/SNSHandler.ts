import { InputHandler } from './inputHandler.js';

export class SNSHandler extends InputHandler {
  static isSNS(input: unknown): boolean {
    const i = input as Record<string, unknown[]>;
    return (i.Records?.[0] as Record<string, unknown>)?.EventSource === 'aws:sns';
  }

  static readonly identifier = '__sns__';

  constructor(input: unknown) {
    super('sns');
    this._path = SNSHandler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = this.#distill(input);
    this._format = 'json';
  }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }

  #distill(input: unknown): unknown[] {
    const i = input as { Records: Array<{ Sns: { Message: string } }> };
    return i.Records.map(record => {
      try {
        return JSON.parse(record.Sns.Message);
      } catch {
        return record.Sns.Message;
      }
    });
  }
}
