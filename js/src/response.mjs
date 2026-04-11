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
export class ResponseJSON2CSV extends Response {
    static json2CSV(list) {
        if (!Array.isArray(list) || list.length === 0) {
            return '';
        }
        const csv = [Object.keys(list[0]).join(",")];
        for (const item of list) {
            csv.push(Object.values(item).map(value => {
                if (typeof value === 'string') {
                    if (value.includes(",") || value.includes('"')) {
                        return `"${value.replace(/"/g, '""')}"`; // escape double quotes
                    }
                    return value;
                } else if (!isNaN (value)) {
                    return value; // keep numbers as is
                } else {
                    return value;
                }
            }).join(","));
        }
        return csv.join("\n");
    }
    constructor(data) {
        super(ResponseJSON2CSV.json2CSV(data), 'text/csv');
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
