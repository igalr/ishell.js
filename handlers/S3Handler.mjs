import { InputHandler } from "./inputHandler.mjs";

export class S3Handler extends InputHandler {
    static isS3(input) {
        console.log("Not yet implemented S3Handler.isS3");
        return false;
        if (input?.Name !== "ContactFlowEvent") return false
        if (!input.Details) return false
        if (!input.Details.ContactData) return false
        return true;
    }
    static identifier = '__s3__';
    constructor(input) {
        super('s3');
        this._path = S3Handler.identifier;
        this._method = "post";
        this._params = null;
        this._payload = input;
        this._format = "json";
    }

    shortInputLog(input) {
        return ('NOTE: FORMAT SHORT LOG FORMAT', JSON.stringify(input));
    }
}