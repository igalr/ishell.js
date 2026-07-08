export abstract class Response {
  readonly #content: any;
  #returnCode = 200;
  #headers: Record<string, string> = {};

  get content(): any { return this.#content; }
  get contentType(): string | null { return this.#headers['Content-Type'] || null; }
  get returnCode(): number { return this.#returnCode; }
  get headers(): Record<string, string> { return this.#headers; }

  constructor(content: any, contentType: string | null) {
    this.#content = content;
    if (contentType) this.#headers['Content-Type'] = contentType;
  }

  errorCode(code: number): this {
    this.#returnCode = code;
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.#headers = headers;
    return this;
  }
}

export class ResponseJSON extends Response {
  constructor(data: any) {
    super(data instanceof String ? data : JSON.stringify(data), 'application/json');
  }
}

export class ResponseCSV extends Response {
  constructor(data: string) {
    super(data, 'text/csv');
  }
}

export class ResponseJSON2CSV extends Response {
  static json2CSV(list: any[]): string {
    if (!Array.isArray(list) || list.length === 0) return '';
    const records = list as Record<string, any>[];
    const csv = [Object.keys(records[0]).join(',')];
    for (const item of records) {
      csv.push(
        Object.values(item).map(value => {
          if (typeof value === 'string') {
            if (value.includes(',') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          } else if (typeof value === 'number' || !isNaN(Number(value))) {
            return value;
          } else {
            return value;
          }
        }).join(',')
      );
    }
    return csv.join('\n');
  }
  constructor(data: any[]) {
    super(ResponseJSON2CSV.json2CSV(data), 'text/csv');
  }
}

export class ResponseText extends Response {
  constructor(data: string) {
    super(data, 'text/plain');
  }
}

export class ResponseHTML extends Response {
  constructor(data: string) {
    super(data, 'text/html');
  }
}

export class ResponseXML extends Response {
  constructor(data: string) {
    super(data, 'text/xml');
  }
}

export class ResponseCORS extends Response {
  constructor(headers: Record<string, string>) {
    super(null, null);
    super.withHeaders(headers);
  }
}
export class ResponseError extends Response {
  constructor(errorCode: number, message: string) {
    super(message, 'text/plain');
    this.errorCode(errorCode);
  }
}
