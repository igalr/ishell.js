import { InputHandler } from "./inputHandler.mjs";

export class SNSHandler extends InputHandler {
    static isSNS(input) {
        return input?.Records?.[0]?.EventSource === "aws:sns";
    }

    static identifier = '__sns__';
    constructor(input) {
        super('sns');
        this._path = SNSHandler.identifier;
        this._method = "post";
        this._params = {};
        this._payload = this.#distill(input);
        this._format = "json";
    }

    shortInputLog(input) {
        return ('NOTE: FORMAT SHORT LOG FORMAT', JSON.stringify(input));
    }

    #distill(input) {
        return input.Records.map(record => JSON.parse(record.Sns.Message) || record.Sns.Message);
    }
}