import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class AmazonConnectHandler extends InputHandler {
  static isAmazonConnect(input: any): boolean {
    const i = input as Record<string, any>;
    if (i?.Name !== 'ContactFlowEvent') return false;
    if (!i.Details) return false;
    const details = i.Details as Record<string, any>;
    if (!details.ContactData) return false;
    return true;
  }

  readonly #initMethod: string;
  get initMethod(): string { return this.#initMethod; }

  readonly #contactid: string | undefined;
  get contactid(): string | undefined { return this.#contactid; }

  readonly #systemEndpoint: string | undefined;
  get systemEndpoint(): string | undefined { return this.#systemEndpoint; }

  readonly #customerEndpoint: string | undefined;
  get customerEndpoint(): string | undefined { return this.#customerEndpoint; }

  readonly #instanceARN: string | undefined;
  get instanceARN(): string | undefined { return this.#instanceARN; }

  constructor(input: Record<string, any>) {
    super('amazon_connect');
    const details = input.Details as Record<string, any>;
    this._params = (details.Parameters as Record<string, any>) || null;
    const contactData = details.ContactData as Record<string, any>;
    if (!this._params) {
      this._params = (contactData.Attributes as Record<string, any>) || {};
    }

    let path = (this._params['path'] as string) || '';
    this._path = path.split('/');

    const attrs = contactData.Attributes as Record<string, any> | undefined;
    this._method = (attrs?.method as string) || 'get';
    this.#contactid = contactData.ContactId as string | undefined;
    if (this.#contactid) this._params['contactid'] = this.#contactid;
    this.#systemEndpoint = (contactData.SystemEndpoint as Record<string, string> | undefined)?.Address;
    this.#customerEndpoint = (contactData.CustomerEndpoint as Record<string, string> | undefined)?.Address;
    this._payload = attrs;
    this.#initMethod = contactData.InitiationMethod as string;
    this.#instanceARN = contactData.InstanceARN as string | undefined;
  }

  get attributes(): any { return this._payload; }

  shortInputLog(input: any): string {
    return JSON.stringify(input);
  }

  processResponse(response: Response, _headers: Record<string, string> = {}): any {
    const body = response.content as Record<string, any>;
    body['lambdaResult'] = 'Success';
    return body;
  }
}
