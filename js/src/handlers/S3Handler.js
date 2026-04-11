import { InputHandler } from "./inputHandler.js";

export class S3Handler extends InputHandler {
    static isS3(input) {
        return input?.Records?.[0]?.eventSource === 'aws:s3';
    }

    static identifier = '__s3__';

    constructor(input) {
        super('s3');
        this._path = S3Handler.identifier;
        this._method = "post";
        this._params = {};
        this._payload = S3Handler.#distill(input);
        this._format = "json";
    }

    static #distill(input) {
        return (input?.Records ?? []).map(record => ({
            eventName: record.eventName,
            bucket: record.s3?.bucket?.name,
            key: record.s3?.object?.key,
            size: record.s3?.object?.size,
        }));
    }

    shortInputLog(input) {
        const first = input?.Records?.[0];
        const bucket = first?.s3?.bucket?.name ?? '?';
        const key = first?.s3?.object?.key ?? '?';
        return `S3 ${first?.eventName ?? 'event'}: s3://${bucket}/${key}`;
    }
}