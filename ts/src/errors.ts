export class BaseError extends Error {
  readonly #statusCode: number;
  readonly #name: string;

  get statusCode(): number {
    return this.#statusCode;
  }
  get name(): string {
    return this.#name;
  }
  get isBaseError(): boolean {
    return true;
  }

  constructor(name: string, message: string, statusCode: number) {
    super(message);
    this.#name = name;
    this.#statusCode = statusCode;
  }

  toJSON() {
    let trace: string[] = [];
    try {
      trace = this.stack?.split('\n').slice(1) || [];
      trace = trace.map(line => line.trim());
    } catch {}
    return {
      type: this.#name,
      message: this.message,
      code: this.#statusCode,
      stack: trace,
    };
  }
}

export class NotFoundError extends BaseError {
  constructor(message = "Not Found", statusCode = 404) {
    super("NotFoundError", message, statusCode);
  }
}

export class MissingValueError extends BaseError {
  constructor(message = "Value is missing", statusCode = 501) {
    super("MissingValueError", message, statusCode);
  }
}

export class AuthError extends BaseError {
  constructor(message = "Unauthorized", statusCode = 401) {
    super("AuthError", message, statusCode);
  }
}

export class SystemError extends BaseError {
  constructor(message = "System Error", statusCode = 500) {
    super("SystemError", message, statusCode);
  }
}

export class NotAllowedError extends BaseError {
  constructor(message = "Not Allowed", statusCode = 403) {
    super("NotAllowedError", message, statusCode);
  }
}

export class BadFormatError extends BaseError {
  constructor(message = "Bad format", statusCode = 400) {
    super("BadFormatError", message, statusCode);
  }
}

export class NotImplementedError extends BaseError {
  constructor(message = "Not Implemented", statusCode = 501) {
    super("NotImplementedError", message, statusCode);
  }
}

export class AccessDeniedError extends BaseError {
  #commandName: any;
  #commandInput: any;
  constructor(
    message = "Access Denied",
    command: any = null,
    statusCode = 403,
  ) {
    super("AccessDeniedError", message, statusCode);
    this.#commandName = command?.constructor?.name;
    this.#commandInput = command?.input;
  }

  toJSON(): any {
    let json: any = super.toJSON();
    json.command = { name: this.#commandName, input: this.#commandInput };
    return json;
  }
}
