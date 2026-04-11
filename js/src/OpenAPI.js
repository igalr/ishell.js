import { APIInterface } from './API.js';

export default class OpenAPI {
    #api;
    #path;
    #hparams;
    #title;
    #version;

    constructor(api, title, version, path = '/', hparams = {}) {
        this.#api = api;
        if (!path.startsWith('/')) path = '/' + path;
        this.#path = path;
        this.#hparams = hparams;
        this.#title = title || 'API Documentation';
        this.#version = version || '1.0.0';
    }

    async json() {
        const json = {
            openapi: "3.0.0",
            info: {
                title: this.#title,
                version: this.#version
            },
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'x-api-key'
                    }
                }
            }
        };
        json.paths = await this.#generatePaths(this.#api, this.#path, this.#hparams);
        json.tags = await this.#generateTags(this.#api, this.#path);
        return json;
    }

    async #generatePaths(node, root, hparams, tag = null) {
        let paths = {};
        let localHparams = { ...hparams };
        for (const key of Object.keys(node)) {
            let schema = node[key];
            schema = { ...schema, ...hparams };
            const d = await this.#generatePaths(new APIInterface({ [key]: schema }), root, localHparams, tag);
            for (const [p, details] of Object.entries(d)) {
                paths[p] = details;
            }
        }

        for (const [key, value] of Object.entries(node.schema)) {
            const rootNorm = root.endsWith('/') ? root.slice(0, -1) : root;
            let path = `${rootNorm}/${key}`;
            const method = value.method || 'get';

            let params = [];
            for (const [paramName, paramDetails] of Object.entries(localHparams)) {
                params.push({
                    name: paramName,
                    in: paramDetails.in || 'path',
                    required: paramDetails.required || false,
                    schema: { type: paramDetails.type || 'string' },
                    description: paramDetails.description || ''
                });
            }
            if (value.params) {
                for (const [paramName, paramDetails] of Object.entries(value.params)) {
                    params.push({
                        name: paramName,
                        in: paramDetails.in || 'query',
                        required: paramDetails.required || false,
                        default: paramDetails.default || undefined,
                        schema: { type: paramDetails.type || 'string' },
                        description: paramDetails.description || ''
                    });
                }
            }

            const responses = value.responses || { '200': { description: 'Successful response' } };
            let json = {
                summary: value.summary || '',
                description: value.description || '',
                operationId: this.#slug(path),
                tags: tag ? [tag] : [],
                parameters: params,
                responses
            };
            if (responses[401] || responses['401']) {
                json.security = [{ ApiKeyAuth: [] }];
            }
            if (value.body) {
                let mime = "application/json";
                json.requestBody = {
                    content: {
                        [mime]: {
                            schema: value.body || 'object'
                        }
                    }
                }
            }
            json = { [method.toLowerCase()]: json };

            if (value.api === true && typeof value.action === 'function') {
                let prms;
                if (value.params) {
                    prms = [];
                    for (const [paramName, paramDetails] of Object.entries(value.params)) {
                        if (paramDetails.in === 'path') {
                            path += '/' + `{${paramName}}`;
                        }
                        prms.push(paramName);
                        localHparams[paramName] = paramDetails;
                    }
                } else {
                    prms = null;
                }

                let inner = await this.#generatePaths(await value.action(prms), path, localHparams, value.tag);
                if (value.params) {
                    for (const [paramName, paramDetails] of Object.entries(value.params)) {
                        delete localHparams[paramName];
                    }
                }

                for (const [subPath, subDetails] of Object.entries(inner || {})) {
                    paths[subPath] = subDetails;
                }
            } else {
                paths[path] = json;
            }
        }
        return paths;
    }

    async #generateTags(node, root) {
        let tags = [];
        for (const [key, value] of Object.entries(node.schema)) {
            let path = `${root}/${key}`;
            if (value.api === true && typeof value.action === 'function') {
                tags.push({
                    name: value.tag || path,
                    description: value.description || ''
                });

                let prms;
                if (value.params) {
                    prms = [];
                    for (const [paramName, paramDetails] of Object.entries(value.params)) {
                        if (paramDetails.in === 'path') {
                            path += '/' + `{${paramName}}`;
                        }
                        prms.push(paramName);
                    }
                } else {
                    prms = null;
                }

                let inner = await this.#generateTags(await value.action(prms), path);
                tags = [...tags, ...inner];
            }
        }
        return tags;
    }

    #slug(path) {
        if (path.startsWith('/')) path = path.slice(1);
        if (path.endsWith('/')) path = path.slice(0, -1);
        return path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    }
}
