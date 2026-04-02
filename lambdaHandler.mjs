import { handlers } from "./handlers/handlers.mjs";
import { AuthError, BaseError } from "./errors.mjs";
import fs from 'fs';
import mime from 'mime-types';
import { type } from "os";

export const handleLambdaTrigger = async (input, target) => {
    let handler = handlers.matchHandler(input);
    if (!handler) {
        return {
            statusCode: 400,
            body: 'Input not recognized'
        };
    }

    console.log({handler: handler.type, path: handler.path});

    let headers = {};
    if (handler.method === 'options') {
        headers = {
            "Access-Control-Allow-Origin": "*", // allow all domains
            "Access-Control-Allow-Methods": "GET,POST",
            "Access-Control-Allow-Headers": input.headers['access-control-request-headers']
        }
        return {
            statusCode: 200,
            headers: headers
        };
    }

    let path = handler.path;
    if (path[0] === 'docs') {
        // console.log('Serving docs', path);
        // console.log('CWD', process.cwd());
        let filename;
        let contentType;
        if (path.length > 1) {
            filename = path.slice(1).join('/');
            const format = handler.format;
            if (format) {
                filename += '.' + format;
                contentType = mime.lookup(filename) || 'application/octet-stream';
            }
        } else {
            filename = 'index.html';
            contentType = 'text/html';
        }
        filename = process.cwd() + '/swagger/' + filename;
        console.log('Filename', filename);
        const data = fs.readFileSync(filename);
        console.log('file', data.length);
        return {
            statusCode: 200,
            headers: {
                ...headers,
                "Content-Type": contentType
            },
            body: data.toString()
        };
    }

    const requestHeaders = { ...handler.headers, '_handler_type': handler.type };

    try {
        const response = await target.execute(path, handler.params, handler.method, handler.payload, requestHeaders);
        return handler.processResponse(response, headers);
    } catch (err) {
        if (err instanceof BaseError) {
            return {
                statusCode: err.statusCode,
                headers,
                body: JSON.stringify({ error: err.message, type: err.name })
            };
        }
        const msg = err.message;
        const trace = handler.params.stacktrace !== 'false' ? err.stack.split('\n').slice(1).map(line => line.trim()) : undefined;
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: msg, stack: trace }) || 'Internal Application Error'
        };
    }
}
