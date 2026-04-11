
import { InputHandler } from "./inputHandler.mjs";

export class LambdaURLHandler extends InputHandler {
    static isLambdaURL(input) {
        if (!input.requestContext) return false;
        if (!input.requestContext.http) return false;
        if (!input.requestContext.http.method) return false
        if (!input.requestContext.http.path) return false
        return true;
    }

    constructor(input) {
        super('lambda_url');
        super._method = input.requestContext?.http?.method;
        super._params = input.queryStringParameters || {};

        this._payload = input.body;
        try {
            this._payload = JSON.parse(this._payload);
        } catch (e) {
            // console.log('error', e.message);
        }

        // console.log('input', JSON.stringify(input));
        let path = input.requestContext?.http?.path;
        // console.log('path', path, input.requestContext?.http?.path);
        if (path[0] === '/') path = path.substring(1);
        const pos = path.lastIndexOf('.');
        if (pos > 0) {
            super._format = path.substring(pos + 1);
            path = path.substring(0, pos);
        } else {
            super._format = 'json';
        }
        super._path = path.split('/');
        super._headers = input.headers || {};
    }

    shortInputLog(input) {
        return ("LambdaURL request", JSON.stringify({
            path: input.requestContext?.http?.path || input.raw.path,
            method: input.requestContext?.http?.method,
            params: input.queryStringParameters,
            sourceIp: input.requestContext?.http?.sourceIp
        }));
    }

    processResponse(response, headers = {}) {
        headers = {
            ...headers,
            "Content-Type": response.contentType,
            "Access-Control-Allow-Origin": "*", // allow all domains
        };
        const body = response.contentType === 'application/json' ? JSON.stringify(response.content) : response.content;
        return {
            statusCode: response.returnCode,
            headers: headers,
            body: body
        };
    }

}