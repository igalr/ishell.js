import { InputHandler } from "./inputHandler.mjs";

export class ConsoleHandler extends InputHandler {
    constructor(path, params, method, body) {
        super('console');
        this._path = path;
        this._params = params;
        this._method = method;
        this._payload = body;
        this._headers = { '_handler_type': 'console' };
    }

    // Parse a raw CLI input line into { path, params, body }.
    // Format: <seg1> <seg2> ... [--key value ...] ['<json-body>']
    static parse(line) {
        const tokens = ConsoleHandler.#tokenize(line.trim());
        const path = [];
        const params = {};
        let body = null;

        let i = 0;
        // Leading non-flag tokens are the path
        while (i < tokens.length && !tokens[i].startsWith('--')) {
            path.push(tokens[i]);
            i++;
        }

        // Parse --key value pairs; a non-flag token encountered mid-parse is the body
        while (i < tokens.length) {
            if (tokens[i].startsWith('--')) {
                const key = tokens[i].slice(2);
                if (i + 1 < tokens.length && !tokens[i + 1].startsWith('--')) {
                    params[key] = tokens[i + 1];
                    i += 2;
                } else {
                    params[key] = true;
                    i++;
                }
            } else {
                // Non-flag token: remaining tokens form the body
                const raw = tokens.slice(i).join(' ');
                try {
                    body = JSON.parse(raw);
                } catch {
                    body = raw;
                }
                break;
            }
        }

        return { path, params, body };
    }

    static #tokenize(line) {
        const tokens = [];
        let current = '';
        let inSingle = false;
        let inDouble = false;

        for (const c of line) {
            if (c === "'" && !inDouble) {
                inSingle = !inSingle;
            } else if (c === '"' && !inSingle) {
                inDouble = !inDouble;
            } else if (c === ' ' && !inSingle && !inDouble) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += c;
            }
        }
        if (current) tokens.push(current);
        return tokens;
    }

    processResponse(response) {
        const content = response.content;
        if (response.contentType?.startsWith('application/json')) {
            process.stdout.write(JSON.stringify(content, null, 2) + '\n');
        } else {
            process.stdout.write(String(content) + '\n');
        }
    }
}
