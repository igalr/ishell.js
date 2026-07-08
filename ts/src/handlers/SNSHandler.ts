import { InputHandler } from './inputHandler.js';

export class SNSHandler extends InputHandler {
  static isSNS(input: any): boolean {
    const i = input as Record<string, any[]>;
    return (i.Records?.[0] as Record<string, any>)?.EventSource === 'aws:sns';
  }

  static readonly identifier = '__sns__';

  constructor(input: any) {
    super('sns');
    this._path = [SNSHandler.identifier];
    this._method = 'post';
    this._params = {};
    this._payload = this.#distill(input);
    this._format = 'json';
  }

  shortInputLog(input: any): string {
    return JSON.stringify(input);
  }

  #distill(input: any): any[] {
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
