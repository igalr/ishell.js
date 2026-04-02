
import { InputHandler } from "./inputHandler.mjs";

export class AmazonConnectHandler extends InputHandler {
    static isAmazonConnect(input) {
        if (input?.Name !== "ContactFlowEvent") return false
        if (!input.Details) return false
        if (!input.Details.ContactData) return false
        return true;
    }

    #initMethod; get initMethod() { return this.#initMethod; }
    #contactid; get contactid() { return this.#contactid; }
    #systemEndpoint; get systemEndpoint() { return this.#systemEndpoint; }
    #customerEndpoint; get customerEndpoint() { return this.#customerEndpoint; }
    #instanceARN; get instanceARN() { return this.#instanceARN; }

    constructor(input) {
        super('amazon_connect');
        this._params = input.Details.Parameters || null;
        const contactData = input.Details.ContactData;
        if (!this._params) {
            this._params = contactData.Attributes || {};
        }

        this._path = this._params.path;
        if (!this._path) {
            this._path = '';
        }
        this._path = this._path.split('/');

        this._method = contactData.Attributes?.method || 'get';
        this.#contactid = contactData.ContactId;
        if (this.#contactid) this._params.contactid = this.#contactid;
        this.#systemEndpoint = contactData.SystemEndpoint?.Address;
        this.#customerEndpoint = contactData.CustomerEndpoint?.Address;
        this._payload = contactData.Attributes;
        this.#initMethod = contactData.InitiationMethod;
        this.#instanceARN = contactData.InstanceARN;
    }

    get attributes() { return this._payload; }

    processResponse(response, headers = {}) {
        let body = response.content;
        body.lambdaResult = 'Success';
        return body;
    }

    get json() {
        let json = this.json;
        json.initMethod = this.#initMethod;
        json.contactId = this.#contactid;
        json.systemEndpoint = this.#systemEndpoint;
        json.customerEndpoint = this.#customerEndpoint;
        json.instanceARN = this.#instanceARN;
        return json;
    }
}