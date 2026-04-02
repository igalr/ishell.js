export class InputHandler {
    constructor(type) {
        this.#type = type;
    }

    #type; get type() { return this.#type; }
    _path; get path() { return this._path; }
    _method; get method() { return this._method; }
    _params; get params() { return this._params; }
    _payload; get payload() { return this._payload; }
    _format; get format() { return this._format; }
    _headers = {}; get headers() { return this._headers; }

    getParam(key) { return this._params[key]; }

    processResponse(response, headers = {}) {
        return response;
    }

    get json() {
        return {
            type: this.#type,
            method: this._method,
            path: this._path,
            params: this._params,
            payload: this._payload,
            format: this._format
        }
    }
}
