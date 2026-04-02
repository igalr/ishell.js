export class BaseError extends Error {
    #statusCode; get statusCode() { return this.#statusCode; }
    #name; get name() { return this.#name; }

    constructor(name, message, statusCode) {
        super(message);
        this.#name = name;
        this.#statusCode = statusCode;
    }
}

export class NotFoundError extends BaseError {
    constructor(message = 'Not Found', statusCode = 404) {
        super('NotFoundError', message, statusCode);
    }
}

export class MissingValueError extends BaseError {
    constructor(message = 'Value is missing', statusCode = 501) {
        super('MissingValueError', message, statusCode);
    }
}

export class AuthError extends BaseError {
    constructor(message = 'Unauthorized', statusCode = 401) {
        super('AuthError', message, statusCode);
    }
}

export class SystemError extends BaseError {
    constructor(message = 'System Error', statusCode = 500) {
        super('SystemError', message, statusCode);
    }
}

export class NotAllowedError extends BaseError {
    constructor(message = 'Not Allowed', statusCode = 403) {
        super('NotAllowedError', message, statusCode);
    }
}

export class BadFormatError extends BaseError {
    constructor(message = 'Bad format', statusCode = 400) {
        super('BadFormatError', message, statusCode);
    }
}

export class NotImplementedError extends BaseError {
    constructor(message = 'Not Implemented', statusCode = 501) {
        super('NotImplementedError', message, statusCode);
    }
}
