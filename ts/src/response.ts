abstract class Response {
  readonly #content: unknown;
  readonly #contentType: string;
  #returnCode = 200;

  get content(): unknown { return this.#content; }
  get contentType(): string { return this.#contentType; }
  get returnCode(): number { return this.#returnCode; }

  constructor(content: unknown, contentType: string) {
    this.#content = content;
    this.#contentType = contentType;
  }

  errorCode(code: number): this {
    this.#returnCode = code;
    return this;
  }
}

export class ResponseJSON extends Response {
  constructor(data: unknown) {
    super(data, 'application/json');
  }
}

export class ResponseCSV extends Response {
  constructor(data: string) {
    super(data, 'text/csv');
  }
}

export class ResponseJSON2CSV extends Response {
  static json2CSV(list: unknown[]): string {
    if (!Array.isArray(list) || list.length === 0) return '';
    const records = list as Record<string, unknown>[];
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
  constructor(data: unknown[]) {
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

export type { Response };
