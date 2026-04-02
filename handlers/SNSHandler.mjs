import { InputHandler } from "./inputHandler.mjs";

export class SNSHandler extends InputHandler {
    static isSNS(input) {
        console.log ("Not yet implemented SNSHandler.isSNS");
        return false;
        if (input?.Name !== "ContactFlowEvent") return false
        if (!input.Details) return false
        if (!input.Details.ContactData) return false
        return true;
    }
    static identifier = '__sns__';
    constructor(input) {
        super('sns');
        this._path = SNSHandler.identifier;
        this._method = "post";
        this._params = null;
        this._payload = input;
        this._format = "json";
    }
}