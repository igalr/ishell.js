
import { InputHandler } from "./inputHandler.mjs";

export class KinesistHandler extends InputHandler {
    static isKinesis(input) {
        return input?.Records?.[0]?.eventSource === "aws:kinesis";
    }

    static identifier = '__kinesis__';
    constructor(input) {
        super(KinesistHandler.identifier);
        this._path = KinesistHandler.identifier;
        this._method = "post";
        this._params = {};
        this._payload = input;
        this._format = "json";
    }

    shortInputLog(input) {
        return ('NOTE: FORMAT SHORT LOG FORMAT', JSON.stringify(input));
    }
}