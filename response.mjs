class Response {
    #content; get content() { return this.#content; }
    #contentType; get contentType() { return this.#contentType; }
    #returnCode = 200; get returnCode() { return this.#returnCode; }

    constructor(content, contentType) {
        this.#content = content;
        this.#contentType = contentType;
    }

    errorCode = (code) => {
        this.#returnCode = code;
        return this;
    }
}

export class ResponseJSON extends Response {
    constructor(data) {
        super(data, 'application/json');
    }
}

export class ResponseCSV extends Response {
    constructor(data) {
        super(data, 'text/csv');
    }
}

export class ResponseText extends Response {
    constructor(data) {
        super(data, 'text/plain');
    }
}

export class ResponseHTML extends Response {
    constructor(data) {
        super(data, 'text/html');
    }
}

export class ResponseXML extends Response {
    constructor(data) {
        super(data, 'text/xml');
    }
}
