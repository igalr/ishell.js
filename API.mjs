import { ResponseJSON } from './response.mjs';
import OpenAPI from './OpenAPI.mjs';
import { AuthError, NotFoundError } from './errors.mjs';

export class APIInterface {
    #schema; get schema() { return this.#schema; }
    #title;
    #version;

    constructor(schema = {}, title = "API Documentation", version = "Unknown") {
        this.#schema = this.#restrictSchema(schema);
        this.#title = `${title} (${process.env.AWS_LAMBDA_FUNCTION_NAME || "Local"})`;
        this.#version = version;
    }

    get isAPIInterface() { return true; }

    async execute(path, params, methods, body, headers = {}) {
        if (!Array.isArray(path)) path = [path];
        const pathinit = path ? path.join('/') : '';
        try {
            const node = await this.exrec(path, params, methods, body, headers) || {};
            if (node?.isAPIInterface === true) {
                const d = await node.usage(pathinit, this.schema[pathinit].params);
                return d;
            }
            return node;
        } catch (err) {
            throw err;
        }
    }

    async exrec(path, params, methods, body, headers = {}) {
        let node = this;
        while (path.length > 0) {
            let pathElement = path.splice(0, 1);
            if (Array.isArray(pathElement)) pathElement = pathElement[0];
            node = node.#schema[pathElement];
            if (!node) throw new NotFoundError(pathElement + ' not found');

            if (node.params && Object.keys(node.params).length > 0) {
                for (const key of Object.keys(node.params)) {
                    if (node.params[key]?.in === 'path') {
                        params[key] = path.splice(0, 1)[0];
                    }
                }
            }
            node = await node.action(params, body, headers);
        }
        return node;
    }

    async usage(path, params = {}) {
        const d = await (new OpenAPI(this, this.#title, this.#version, path, params)).json();
        return new ResponseJSON(d);
    }

    addHandler(key, handler) {
        this.#schema[key] = {
            method: "post",
            action: handler
        }
    }

    addLambdaSimulator(simulator) {
        const allowList = process.env.ALLOW_API?.split(",").map(s => s.trim()) || ['all'];
        const denyList = process.env.DENY_API?.split(",").map(s => s.trim()) || [];
        if (denyList.indexOf("lambda") >= 0) return;    // if explicitly denied
        if (allowList.indexOf("all") < 0 && allowList.indexOf("lambda") < 0) return;    // or not explicitly allowd do not allow
        this.#schema.lambda = {
            api: true,
            toplevel: true,
            tag: "Lambda Simulator",
            description: "Simulate Lambda invocation using REST API",
            action: simulator
        }
    }

    #restrictSchema(schema) {
        const allowList = process.env.ALLOW_API?.split(",").map(s => s.trim()) || null;
        const denyList = process.env.DENY_API?.split(",").map(s => s.trim()) || [];
        if (denyList[0]?.toLowerCase() === "all") return {};    // if all is denied return empty schema
        for (const key of Object.keys(schema)) {
            if (schema[key].api && schema[key].toplevel) {
                if ((allowList && allowList.indexOf(key) < 0) || denyList.indexOf(key) >= 0) {
                    delete schema[key];
                }
            }
        }
        return schema;
    }

    // Walk the schema along path and return the declared HTTP method of the terminal node.
    // Intermediate nodes whose action returns another APIInterface are traversed transparently.
    // Defaults to 'get' if the path cannot be resolved or no method is declared.
    async resolveMethod(path) {
        if (!Array.isArray(path)) path = [path];
        path = [...path];
        let currentSchema = this.#schema;
        let method = 'get';
        for (let i = 0; i < path.length; i++) {
            const node = currentSchema[path[i]];
            if (!node) return method;
            if (node.method) method = node.method;
            if (i < path.length - 1 && node.action) {
                try {
                    const next = await node.action({}, null, {});
                    if (next?.isAPIInterface) {
                        currentSchema = next.schema;
                    } else {
                        return method;
                    }
                } catch {
                    return method;
                }
            }
        }
        return method;
    }

    confirmAPIKey(headers, apiKey) {
        if (apiKey) {
            const provided = headers['x-api-key'];
            if (!provided || provided !== apiKey) {
                throw new AuthError('Invalid or missing API key');
            }
        }
    }
}
