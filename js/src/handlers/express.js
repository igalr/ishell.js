
import { InputHandler } from "./inputHandler.js";

export class ExpressURLHandler extends InputHandler {
    static isExpressURL(input) {
        if (!input.method) return false;
        if (!input.requestContext) return false;
        if (!input.requestContext.http) return false;
        if (!input.requestContext.http.path) return false;
        return true;
    }

    constructor(input) {
        super('express');
        this._method = input.method;
        this._params = input.query || {};

        this._payload = input.body;
        try {
            this._payload = JSON.parse(this._payload);
        } catch (e) {
            // console.log('error', e.message);
        }

        this._path = input.requestContext?.http?.path || '';
        if (this._path[0] === '/') this._path = this._path.substring(1);
        const pos = this._path.lastIndexOf('.');
        if (pos > 0) {
            this._format = this._path.substring(pos + 1);
            this._path = this._path.substring(0, pos);
        } else {
            this._format = 'json';
        }
        this._path = this._path.split('/');
        this._headers = input.headers || {};
    }

    processResponse(response, headers = {}) {
        headers["Content-Type"] = response.contentType;
        const body = response.contentType === 'application/json' ? JSON.stringify(response.content) : response.content;
        return {
            statusCode: response.returnCode,
            headers: headers,
            body: body
        };
    }
}