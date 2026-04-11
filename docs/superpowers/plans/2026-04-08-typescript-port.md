# TypeScript Port of ishell.js — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all source files from `js/` to strict TypeScript in `ts/src/`, compiling to `ts/dist/` via `tsc` with full type coverage and a Vitest test suite.

**Architecture:** Each `js/*.mjs` becomes `ts/src/*.ts`. `SchemaNode`, `ParamDefinition`, `ActionResult`, `Response`, and `InputHandler` form the shared type backbone. All intra-src imports use `.js` extensions (NodeNext ESM convention). `ts/` is fully independent of `js/` — no cross-directory imports.

**Tech Stack:** TypeScript 5, Node.js ESM (`"type": "module"`), Vitest 3, Express 5, `@aws-sdk/client-sns`, `@aws-sdk/credential-providers`.

---

## File Map

| Created file | Responsibility |
|---|---|
| `ts/package.json` | Dependencies, scripts, ESM config |
| `ts/tsconfig.json` | Strict NodeNext compilation |
| `ts/vitest.config.ts` | Test runner config |
| `ts/.gitignore` | Ignore `dist/`, `node_modules/` |
| `ts/src/errors.ts` | Typed error hierarchy |
| `ts/src/response.ts` | Response types (`ResponseJSON`, etc.) |
| `ts/src/handlers/inputHandler.ts` | Abstract `InputHandler` base class |
| `ts/src/handlers/lambdaURL.ts` | Lambda Function URL event handler |
| `ts/src/handlers/express.ts` | Express-forwarded event handler |
| `ts/src/handlers/amazonConnect.ts` | Amazon Connect event handler |
| `ts/src/handlers/KinesisHandler.ts` | Kinesis event handler |
| `ts/src/handlers/S3Handler.ts` | S3 event handler (stub) |
| `ts/src/handlers/SNSHandler.ts` | SNS event handler |
| `ts/src/handlers/console.ts` | CLI readline handler |
| `ts/src/handlers/handlers.ts` | Handler registry / detector |
| `ts/src/aws/Kinesis.ts` | Typed Kinesis record wrappers |
| `ts/src/notifications/NotificationChannel.ts` | Webhook notifier |
| `ts/src/notifications/SNSPublisher.ts` | AWS SNS publisher |
| `ts/src/API.ts` | `APIInterface` + schema types |
| `ts/src/OpenAPI.ts` | OpenAPI 3.0 JSON generator |
| `ts/src/LambdaSimulatorAPI.ts` | Lambda simulator sub-API |
| `ts/src/lambdaHandler.ts` | Lambda entry point dispatcher |
| `ts/src/localServer.ts` | Express local dev server |
| `ts/src/localCLI.ts` | Interactive readline CLI |
| `ts/src/local.ts` | Example dev entry point |
| `ts/src/exports.ts` | Library public surface (ESM re-exports) |

Test files: `ts/src/__tests__/<module>.test.ts` — one per source module.

---

## Task 1: Scaffold — package.json, tsconfig.json, vitest.config.ts

**Files:**
- Create: `ts/package.json`
- Create: `ts/tsconfig.json`
- Create: `ts/vitest.config.ts`
- Create: `ts/.gitignore`

- [ ] **Step 1: Create `ts/package.json`**

```json
{
  "name": "ishell.js",
  "version": "1.3.1",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --exec node dist/local.js",
    "start": "node dist/local.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@aws-sdk/client-sns": "^3.758.0",
    "@aws-sdk/credential-providers": "^3.758.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "mime-types": "^3.0.2",
    "path": "^0.12.7"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.1",
    "@types/mime-types": "^2.1.4",
    "@types/node": "^22.0.0",
    "nodemon": "^3.1.11",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Create `ts/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `ts/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create `ts/.gitignore`**

```
dist/
node_modules/
package-lock.json
```

- [ ] **Step 5: Install dependencies**

```bash
cd ts && npm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 6: Commit**

```bash
git add ts/package.json ts/tsconfig.json ts/vitest.config.ts ts/.gitignore
git commit -m "feat(ts): scaffold TypeScript project with build and test config"
```

---

## Task 2: errors.ts

**Files:**
- Create: `ts/src/errors.ts`
- Create: `ts/src/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  BaseError, NotFoundError, MissingValueError, AuthError,
  SystemError, NotAllowedError, BadFormatError, NotImplementedError
} from '../errors.js';

describe('BaseError', () => {
  it('is an instance of Error', () => {
    const err = new NotFoundError();
    expect(err instanceof Error).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 and name NotFoundError', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('NotFoundError');
    expect(err.message).toBe('Not Found');
  });
  it('accepts a custom message', () => {
    const err = new NotFoundError('item missing');
    expect(err.message).toBe('item missing');
  });
});

describe('AuthError', () => {
  it('has statusCode 401', () => {
    expect(new AuthError().statusCode).toBe(401);
  });
});

describe('MissingValueError', () => {
  it('has statusCode 501', () => {
    expect(new MissingValueError().statusCode).toBe(501);
  });
});

describe('SystemError', () => {
  it('has statusCode 500', () => {
    expect(new SystemError().statusCode).toBe(500);
  });
});

describe('NotAllowedError', () => {
  it('has statusCode 403', () => {
    expect(new NotAllowedError().statusCode).toBe(403);
  });
});

describe('BadFormatError', () => {
  it('has statusCode 400', () => {
    expect(new BadFormatError().statusCode).toBe(400);
  });
});

describe('NotImplementedError', () => {
  it('has statusCode 501', () => {
    expect(new NotImplementedError().statusCode).toBe(501);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/errors.test.ts
```

Expected: FAIL — `Cannot find module '../errors.js'`

- [ ] **Step 3: Implement `ts/src/errors.ts`**

```typescript
export class BaseError extends Error {
  readonly #statusCode: number;
  readonly #name: string;

  get statusCode(): number { return this.#statusCode; }
  get name(): string { return this.#name; }

  constructor(name: string, message: string, statusCode: number) {
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/errors.test.ts
```

Expected: PASS — 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/errors.ts ts/src/__tests__/errors.test.ts
git commit -m "feat(ts): add typed error hierarchy"
```

---

## Task 3: response.ts

**Files:**
- Create: `ts/src/response.ts`
- Create: `ts/src/__tests__/response.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/response.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  ResponseJSON, ResponseText, ResponseHTML, ResponseXML,
  ResponseCSV, ResponseJSON2CSV
} from '../response.js';

describe('ResponseJSON', () => {
  it('has application/json content type', () => {
    const r = new ResponseJSON({ foo: 'bar' });
    expect(r.contentType).toBe('application/json');
    expect(r.content).toEqual({ foo: 'bar' });
    expect(r.returnCode).toBe(200);
  });
  it('errorCode() sets returnCode and returns self', () => {
    const r = new ResponseJSON({});
    const same = r.errorCode(404);
    expect(same).toBe(r);
    expect(r.returnCode).toBe(404);
  });
});

describe('ResponseText', () => {
  it('has text/plain content type', () => {
    expect(new ResponseText('hello').contentType).toBe('text/plain');
  });
});

describe('ResponseHTML', () => {
  it('has text/html content type', () => {
    expect(new ResponseHTML('<p/>').contentType).toBe('text/html');
  });
});

describe('ResponseXML', () => {
  it('has text/xml content type', () => {
    expect(new ResponseXML('<x/>').contentType).toBe('text/xml');
  });
});

describe('ResponseCSV', () => {
  it('has text/csv content type', () => {
    expect(new ResponseCSV('a,b').contentType).toBe('text/csv');
  });
});

describe('ResponseJSON2CSV', () => {
  it('converts array of objects to CSV string', () => {
    const r = new ResponseJSON2CSV([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
    expect(r.contentType).toBe('text/csv');
    expect(r.content).toBe('a,b\n1,2\n3,4');
  });
  it('returns empty string for empty array', () => {
    expect(new ResponseJSON2CSV([]).content).toBe('');
  });
  it('escapes commas in string values', () => {
    const r = new ResponseJSON2CSV([{ name: 'a,b' }]);
    expect(r.content).toBe('name\n"a,b"');
  });
  it('escapes double quotes in string values', () => {
    const r = new ResponseJSON2CSV([{ name: 'say "hi"' }]);
    expect(r.content).toBe('name\n"say ""hi"""');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/response.test.ts
```

Expected: FAIL — `Cannot find module '../response.js'`

- [ ] **Step 3: Implement `ts/src/response.ts`**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/response.test.ts
```

Expected: PASS — 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/response.ts ts/src/__tests__/response.test.ts
git commit -m "feat(ts): add typed response hierarchy"
```

---

## Task 4: handlers/inputHandler.ts

**Files:**
- Create: `ts/src/handlers/inputHandler.ts`
- Create: `ts/src/__tests__/inputHandler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/inputHandler.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { InputHandler } from '../handlers/inputHandler.js';
import type { Response } from '../response.js';

// Concrete subclass used only for testing the base class
class TestHandler extends InputHandler {
  constructor() {
    super('test-type');
    this._path = ['a', 'b'];
    this._method = 'GET';
    this._params = { key: 'val' };
    this._payload = { data: 1 };
    this._format = 'json';
    this._headers = { 'x-custom': 'yes' };
  }
}

describe('InputHandler', () => {
  it('exposes type via getter', () => {
    expect(new TestHandler().type).toBe('test-type');
  });
  it('exposes path, method, params, payload, format, headers', () => {
    const h = new TestHandler();
    expect(h.path).toEqual(['a', 'b']);
    expect(h.method).toBe('GET');
    expect(h.params).toEqual({ key: 'val' });
    expect(h.payload).toEqual({ data: 1 });
    expect(h.format).toBe('json');
    expect(h.headers).toEqual({ 'x-custom': 'yes' });
  });
  it('getParam returns value for key', () => {
    expect(new TestHandler().getParam('key')).toBe('val');
  });
  it('shortInputLog truncates long input to ~103 chars', () => {
    const h = new TestHandler();
    const log = h.shortInputLog({ data: 'x'.repeat(200) });
    expect(log.length).toBeLessThanOrEqual(103);
    expect(log.endsWith('...')).toBe(true);
  });
  it('shortInputLog returns full string when short', () => {
    const h = new TestHandler();
    const log = h.shortInputLog({ x: 1 });
    expect(log).toBe('{"x":1}');
  });
  it('json getter returns structured object', () => {
    const h = new TestHandler();
    expect(h.json).toMatchObject({
      type: 'test-type',
      method: 'GET',
      path: ['a', 'b'],
      params: { key: 'val' },
      format: 'json',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/inputHandler.test.ts
```

Expected: FAIL — `Cannot find module '../handlers/inputHandler.js'`

- [ ] **Step 3: Implement `ts/src/handlers/inputHandler.ts`**

```typescript
import type { Response } from '../response.js';

export abstract class InputHandler {
  readonly #type: string;
  get type(): string { return this.#type; }

  protected _path: string[] = [];
  protected _method: string = '';
  protected _params: Record<string, unknown> = {};
  protected _payload: unknown = null;
  protected _format: string = 'json';
  protected _headers: Record<string, string> = {};

  get path(): string[] { return this._path; }
  get method(): string { return this._method; }
  get params(): Record<string, unknown> { return this._params; }
  get payload(): unknown { return this._payload; }
  get format(): string { return this._format; }
  get headers(): Record<string, string> { return this._headers; }

  constructor(type: string) {
    this.#type = type;
  }

  getParam(key: string): unknown {
    return this._params[key];
  }

  processResponse(response: Response, headers: Record<string, string> = {}): unknown {
    return response;
  }

  shortInputLog(input: unknown): string {
    let s = JSON.stringify(input);
    if (s.length > 100) s = s.substring(0, 100) + '...';
    return s;
  }

  get json(): Record<string, unknown> {
    return {
      type: this.#type,
      method: this._method,
      path: this._path,
      params: this._params,
      payload: this._payload,
      format: this._format,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/inputHandler.test.ts
```

Expected: PASS — 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/handlers/inputHandler.ts ts/src/__tests__/inputHandler.test.ts
git commit -m "feat(ts): add abstract InputHandler base class"
```

---

## Task 5: handlers/lambdaURL.ts

**Files:**
- Create: `ts/src/handlers/lambdaURL.ts`
- Create: `ts/src/__tests__/lambdaURL.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/lambdaURL.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { LambdaURLHandler } from '../handlers/lambdaURL.js';
import { ResponseJSON } from '../response.js';

const makeInput = (path: string, method = 'GET', query: Record<string, string> = {}, body: string | null = null) => ({
  requestContext: { http: { method, path } },
  queryStringParameters: query,
  body,
  headers: { 'content-type': 'application/json' },
});

describe('LambdaURLHandler.isLambdaURL', () => {
  it('returns true for valid Lambda URL input', () => {
    expect(LambdaURLHandler.isLambdaURL(makeInput('/v1/foo'))).toBe(true);
  });
  it('returns false when requestContext missing', () => {
    expect(LambdaURLHandler.isLambdaURL({})).toBe(false);
  });
  it('returns false when http missing', () => {
    expect(LambdaURLHandler.isLambdaURL({ requestContext: {} })).toBe(false);
  });
  it('returns false when method missing', () => {
    expect(LambdaURLHandler.isLambdaURL({ requestContext: { http: { path: '/x' } } })).toBe(false);
  });
});

describe('LambdaURLHandler', () => {
  it('parses path segments', () => {
    const h = new LambdaURLHandler(makeInput('/v1/foo/bar'));
    expect(h.path).toEqual(['v1', 'foo', 'bar']);
    expect(h.method).toBe('GET');
  });
  it('strips leading slash', () => {
    const h = new LambdaURLHandler(makeInput('/hello'));
    expect(h.path).toEqual(['hello']);
  });
  it('strips file extension and sets format', () => {
    const h = new LambdaURLHandler(makeInput('/v1/report.csv'));
    expect(h.path).toEqual(['v1', 'report']);
    expect(h.format).toBe('csv');
  });
  it('defaults format to json when no extension', () => {
    const h = new LambdaURLHandler(makeInput('/v1/data'));
    expect(h.format).toBe('json');
  });
  it('parses JSON body', () => {
    const h = new LambdaURLHandler(makeInput('/x', 'POST', {}, '{"key":"val"}'));
    expect(h.payload).toEqual({ key: 'val' });
  });
  it('keeps raw body when not valid JSON', () => {
    const h = new LambdaURLHandler(makeInput('/x', 'POST', {}, 'raw text'));
    expect(h.payload).toBe('raw text');
  });
  it('processResponse returns Lambda-shaped object', () => {
    const h = new LambdaURLHandler(makeInput('/x'));
    const resp = new ResponseJSON({ ok: true });
    const out = h.processResponse(resp) as { statusCode: number; body: string; headers: Record<string, string> };
    expect(out.statusCode).toBe(200);
    expect(JSON.parse(out.body)).toEqual({ ok: true });
    expect(out.headers['Content-Type']).toBe('application/json');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/lambdaURL.test.ts
```

Expected: FAIL — `Cannot find module '../handlers/lambdaURL.js'`

- [ ] **Step 3: Implement `ts/src/handlers/lambdaURL.ts`**

```typescript
import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class LambdaURLHandler extends InputHandler {
  static isLambdaURL(input: unknown): boolean {
    const i = input as Record<string, unknown>;
    if (!i?.requestContext) return false;
    const ctx = i.requestContext as Record<string, unknown>;
    if (!ctx?.http) return false;
    const http = ctx.http as Record<string, unknown>;
    if (!http?.method) return false;
    if (!http?.path) return false;
    return true;
  }

  constructor(input: Record<string, unknown>) {
    super('lambda_url');
    const ctx = input.requestContext as Record<string, Record<string, unknown>>;
    this._method = ctx.http.method as string;
    this._params = (input.queryStringParameters as Record<string, unknown>) || {};

    this._payload = input.body;
    try {
      this._payload = JSON.parse(this._payload as string);
    } catch {
      // keep raw body
    }

    let path = ctx.http.path as string;
    if (path[0] === '/') path = path.substring(1);
    const pos = path.lastIndexOf('.');
    if (pos > 0) {
      this._format = path.substring(pos + 1);
      path = path.substring(0, pos);
    } else {
      this._format = 'json';
    }
    this._path = path.split('/');
    this._headers = (input.headers as Record<string, string>) || {};
  }

  shortInputLog(input: unknown): string {
    const i = input as Record<string, unknown>;
    const ctx = i.requestContext as Record<string, Record<string, unknown>> | undefined;
    return JSON.stringify({
      path: ctx?.http?.path,
      method: ctx?.http?.method,
      params: i.queryStringParameters,
      sourceIp: ctx?.http?.sourceIp,
    });
  }

  processResponse(response: Response, headers: Record<string, string> = {}): unknown {
    const outHeaders: Record<string, string> = {
      ...headers,
      'Content-Type': response.contentType,
      'Access-Control-Allow-Origin': '*',
    };
    const body =
      response.contentType === 'application/json'
        ? JSON.stringify(response.content)
        : String(response.content);
    return {
      statusCode: response.returnCode,
      headers: outHeaders,
      body,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/lambdaURL.test.ts
```

Expected: PASS — 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/handlers/lambdaURL.ts ts/src/__tests__/lambdaURL.test.ts
git commit -m "feat(ts): add LambdaURLHandler"
```

---

## Task 6: handlers/express.ts

**Files:**
- Create: `ts/src/handlers/express.ts`
- Create: `ts/src/__tests__/express.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/express.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ExpressURLHandler } from '../handlers/express.js';
import { ResponseJSON } from '../response.js';

const makeInput = (path: string, method = 'GET') => ({
  method,
  requestContext: { http: { path } },
  query: { page: '1' },
  body: '{"x":1}',
  headers: { authorization: 'Bearer tok' },
});

describe('ExpressURLHandler.isExpressURL', () => {
  it('returns true for valid express input', () => {
    expect(ExpressURLHandler.isExpressURL(makeInput('/v1/foo'))).toBe(true);
  });
  it('returns false when method missing', () => {
    expect(ExpressURLHandler.isExpressURL({ requestContext: { http: { path: '/x' } } })).toBe(false);
  });
  it('returns false when requestContext missing', () => {
    expect(ExpressURLHandler.isExpressURL({ method: 'GET' })).toBe(false);
  });
});

describe('ExpressURLHandler', () => {
  it('parses path and strips leading slash', () => {
    const h = new ExpressURLHandler(makeInput('/v1/data'));
    expect(h.path).toEqual(['v1', 'data']);
  });
  it('strips extension and sets format', () => {
    const h = new ExpressURLHandler(makeInput('/v1/report.csv'));
    expect(h.path).toEqual(['v1', 'report']);
    expect(h.format).toBe('csv');
  });
  it('parses query params', () => {
    const h = new ExpressURLHandler(makeInput('/v1/data'));
    expect(h.params).toEqual({ page: '1' });
  });
  it('parses JSON body', () => {
    const h = new ExpressURLHandler(makeInput('/v1/data', 'POST'));
    expect(h.payload).toEqual({ x: 1 });
  });
  it('processResponse returns Lambda-shaped object', () => {
    const h = new ExpressURLHandler(makeInput('/x'));
    const resp = new ResponseJSON({ ok: true });
    const out = h.processResponse(resp, {}) as { statusCode: number; body: string; headers: Record<string, string> };
    expect(out.statusCode).toBe(200);
    expect(out.headers['Content-Type']).toBe('application/json');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/express.test.ts
```

Expected: FAIL — `Cannot find module '../handlers/express.js'`

- [ ] **Step 3: Implement `ts/src/handlers/express.ts`**

```typescript
import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class ExpressURLHandler extends InputHandler {
  static isExpressURL(input: unknown): boolean {
    const i = input as Record<string, unknown>;
    if (!i?.method) return false;
    if (!i?.requestContext) return false;
    const ctx = i.requestContext as Record<string, unknown>;
    if (!ctx?.http) return false;
    const http = ctx.http as Record<string, unknown>;
    if (!http?.path) return false;
    return true;
  }

  constructor(input: Record<string, unknown>) {
    super('express');
    this._method = input.method as string;
    this._params = (input.query as Record<string, unknown>) || {};

    this._payload = input.body;
    try {
      this._payload = JSON.parse(this._payload as string);
    } catch {
      // keep raw body
    }

    const ctx = input.requestContext as Record<string, Record<string, unknown>>;
    let path = (ctx.http.path as string) || '';
    if (path[0] === '/') path = path.substring(1);
    const pos = path.lastIndexOf('.');
    if (pos > 0) {
      this._format = path.substring(pos + 1);
      path = path.substring(0, pos);
    } else {
      this._format = 'json';
    }
    this._path = path.split('/');
    this._headers = (input.headers as Record<string, string>) || {};
  }

  processResponse(response: Response, headers: Record<string, string> = {}): unknown {
    headers['Content-Type'] = response.contentType;
    const body =
      response.contentType === 'application/json'
        ? JSON.stringify(response.content)
        : response.content;
    return {
      statusCode: response.returnCode,
      headers,
      body,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/express.test.ts
```

Expected: PASS — 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/handlers/express.ts ts/src/__tests__/express.test.ts
git commit -m "feat(ts): add ExpressURLHandler"
```

---

## Task 7: handlers/amazonConnect.ts

**Files:**
- Create: `ts/src/handlers/amazonConnect.ts`
- Create: `ts/src/__tests__/amazonConnect.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/amazonConnect.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AmazonConnectHandler } from '../handlers/amazonConnect.js';

const makeInput = (overrides: Record<string, unknown> = {}) => ({
  Name: 'ContactFlowEvent',
  Details: {
    Parameters: { path: 'v1/greet', customKey: 'abc' },
    ContactData: {
      ContactId: 'cid-123',
      Attributes: { method: 'get' },
      SystemEndpoint: { Address: '+1555' },
      CustomerEndpoint: { Address: '+1999' },
      InitiationMethod: 'INBOUND',
      InstanceARN: 'arn:aws:...',
    },
  },
  ...overrides,
});

describe('AmazonConnectHandler.isAmazonConnect', () => {
  it('returns true for a valid ContactFlowEvent', () => {
    expect(AmazonConnectHandler.isAmazonConnect(makeInput())).toBe(true);
  });
  it('returns false when Name is wrong', () => {
    expect(AmazonConnectHandler.isAmazonConnect({ Name: 'Other', Details: { ContactData: {} } })).toBe(false);
  });
  it('returns false when Details missing', () => {
    expect(AmazonConnectHandler.isAmazonConnect({ Name: 'ContactFlowEvent' })).toBe(false);
  });
  it('returns false when ContactData missing', () => {
    expect(AmazonConnectHandler.isAmazonConnect({ Name: 'ContactFlowEvent', Details: {} })).toBe(false);
  });
});

describe('AmazonConnectHandler', () => {
  it('parses path from Parameters', () => {
    const h = new AmazonConnectHandler(makeInput());
    expect(h.path).toEqual(['v1', 'greet']);
  });
  it('sets contactid in params', () => {
    const h = new AmazonConnectHandler(makeInput());
    expect(h.params['contactid']).toBe('cid-123');
  });
  it('exposes initMethod and contactid', () => {
    const h = new AmazonConnectHandler(makeInput());
    expect(h.initMethod).toBe('INBOUND');
    expect(h.contactid).toBe('cid-123');
  });
  it('processResponse adds lambdaResult', () => {
    const h = new AmazonConnectHandler(makeInput());
    const { ResponseJSON } = await import('../response.js');
    const resp = new ResponseJSON({ greeting: 'hello' });
    const result = h.processResponse(resp) as Record<string, unknown>;
    expect(result['lambdaResult']).toBe('Success');
  });
});
```

Note: the `processResponse` test uses a dynamic import to avoid a circular-looking import at the top; restructure to a static import if your test runner complains — both work in Vitest.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/amazonConnect.test.ts
```

Expected: FAIL — `Cannot find module '../handlers/amazonConnect.js'`

- [ ] **Step 3: Implement `ts/src/handlers/amazonConnect.ts`**

```typescript
import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class AmazonConnectHandler extends InputHandler {
  static isAmazonConnect(input: unknown): boolean {
    const i = input as Record<string, unknown>;
    if (i?.Name !== 'ContactFlowEvent') return false;
    if (!i.Details) return false;
    const details = i.Details as Record<string, unknown>;
    if (!details.ContactData) return false;
    return true;
  }

  readonly #initMethod: string;
  get initMethod(): string { return this.#initMethod; }

  readonly #contactid: string | undefined;
  get contactid(): string | undefined { return this.#contactid; }

  readonly #systemEndpoint: string | undefined;
  get systemEndpoint(): string | undefined { return this.#systemEndpoint; }

  readonly #customerEndpoint: string | undefined;
  get customerEndpoint(): string | undefined { return this.#customerEndpoint; }

  readonly #instanceARN: string | undefined;
  get instanceARN(): string | undefined { return this.#instanceARN; }

  constructor(input: Record<string, unknown>) {
    super('amazon_connect');
    const details = input.Details as Record<string, unknown>;
    this._params = (details.Parameters as Record<string, unknown>) || null;
    const contactData = details.ContactData as Record<string, unknown>;
    if (!this._params) {
      this._params = (contactData.Attributes as Record<string, unknown>) || {};
    }

    let path = (this._params['path'] as string) || '';
    this._path = path.split('/');

    const attrs = contactData.Attributes as Record<string, unknown> | undefined;
    this._method = (attrs?.method as string) || 'get';
    this.#contactid = contactData.ContactId as string | undefined;
    if (this.#contactid) this._params['contactid'] = this.#contactid;
    this.#systemEndpoint = (contactData.SystemEndpoint as Record<string, string> | undefined)?.Address;
    this.#customerEndpoint = (contactData.CustomerEndpoint as Record<string, string> | undefined)?.Address;
    this._payload = attrs;
    this.#initMethod = contactData.InitiationMethod as string;
    this.#instanceARN = contactData.InstanceARN as string | undefined;
  }

  get attributes(): unknown { return this._payload; }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }

  processResponse(response: Response, _headers: Record<string, string> = {}): unknown {
    const body = response.content as Record<string, unknown>;
    body['lambdaResult'] = 'Success';
    return body;
  }
}
```

- [ ] **Step 4: Rewrite test to use static import (simpler)**

Replace the dynamic import in the test with a static import at the top:

```typescript
import { ResponseJSON } from '../response.js';
// Remove 'await import' in the test body; use ResponseJSON directly
```

Updated test body for processResponse:
```typescript
  it('processResponse adds lambdaResult', () => {
    const h = new AmazonConnectHandler(makeInput());
    const resp = new ResponseJSON({ greeting: 'hello' });
    const result = h.processResponse(resp) as Record<string, unknown>;
    expect(result['lambdaResult']).toBe('Success');
  });
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/amazonConnect.test.ts
```

Expected: PASS — 8 tests green.

- [ ] **Step 6: Commit**

```bash
git add ts/src/handlers/amazonConnect.ts ts/src/__tests__/amazonConnect.test.ts
git commit -m "feat(ts): add AmazonConnectHandler"
```

---

## Task 8: handlers/KinesisHandler.ts, S3Handler.ts, SNSHandler.ts

These three handlers are simpler; group them in one task.

**Files:**
- Create: `ts/src/handlers/KinesisHandler.ts`
- Create: `ts/src/handlers/S3Handler.ts`
- Create: `ts/src/handlers/SNSHandler.ts`
- Create: `ts/src/__tests__/eventHandlers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/eventHandlers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { KinesistHandler } from '../handlers/KinesisHandler.js';
import { S3Handler } from '../handlers/S3Handler.js';
import { SNSHandler } from '../handlers/SNSHandler.js';

const kinesisInput = {
  Records: [{ eventSource: 'aws:kinesis', data: 'test' }],
};

const snsInput = {
  Records: [
    {
      EventSource: 'aws:sns',
      Sns: { Message: JSON.stringify({ event: 'order.placed' }) },
    },
  ],
};

describe('KinesistHandler.isKinesis', () => {
  it('returns true for kinesis input', () => {
    expect(KinesistHandler.isKinesis(kinesisInput)).toBe(true);
  });
  it('returns false for non-kinesis input', () => {
    expect(KinesistHandler.isKinesis({ Records: [{ eventSource: 'aws:s3' }] })).toBe(false);
  });
});

describe('KinesistHandler', () => {
  it('sets path to __kinesis__ identifier', () => {
    const h = new KinesistHandler(kinesisInput);
    expect(h.path).toBe(KinesistHandler.identifier);
    expect(h.method).toBe('post');
  });
  it('sets payload to the full input', () => {
    const h = new KinesistHandler(kinesisInput);
    expect(h.payload).toEqual(kinesisInput);
  });
});

describe('S3Handler.isS3', () => {
  it('always returns false (not yet implemented)', () => {
    expect(S3Handler.isS3({})).toBe(false);
  });
});

describe('S3Handler', () => {
  it('sets path to __s3__ identifier', () => {
    const h = new S3Handler({});
    expect(h.path).toBe(S3Handler.identifier);
    expect(h.method).toBe('post');
  });
});

describe('SNSHandler.isSNS', () => {
  it('returns true for sns input', () => {
    expect(SNSHandler.isSNS(snsInput)).toBe(true);
  });
  it('returns false for non-sns input', () => {
    expect(SNSHandler.isSNS({ Records: [{ EventSource: 'aws:kinesis' }] })).toBe(false);
  });
});

describe('SNSHandler', () => {
  it('distills SNS messages from Records', () => {
    const h = new SNSHandler(snsInput);
    expect(h.payload).toEqual([{ event: 'order.placed' }]);
  });
  it('sets path to __sns__ identifier', () => {
    const h = new SNSHandler(snsInput);
    expect(h.path).toBe(SNSHandler.identifier);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/eventHandlers.test.ts
```

Expected: FAIL — module not found errors.

- [ ] **Step 3: Implement `ts/src/handlers/KinesisHandler.ts`**

```typescript
import { InputHandler } from './inputHandler.js';

export class KinesistHandler extends InputHandler {
  static isKinesis(input: unknown): boolean {
    const i = input as Record<string, unknown[]>;
    return (i.Records?.[0] as Record<string, unknown>)?.eventSource === 'aws:kinesis';
  }

  static readonly identifier = '__kinesis__';

  constructor(input: unknown) {
    super(KinesistHandler.identifier);
    this._path = KinesistHandler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = input;
    this._format = 'json';
  }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }
}
```

- [ ] **Step 4: Implement `ts/src/handlers/S3Handler.ts`**

```typescript
import { InputHandler } from './inputHandler.js';

export class S3Handler extends InputHandler {
  static isS3(_input: unknown): boolean {
    console.log('Not yet implemented S3Handler.isS3');
    return false;
  }

  static readonly identifier = '__s3__';

  constructor(input: unknown) {
    super('s3');
    this._path = S3Handler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = input;
    this._format = 'json';
  }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }
}
```

- [ ] **Step 5: Implement `ts/src/handlers/SNSHandler.ts`**

```typescript
import { InputHandler } from './inputHandler.js';

export class SNSHandler extends InputHandler {
  static isSNS(input: unknown): boolean {
    const i = input as Record<string, unknown[]>;
    return (i.Records?.[0] as Record<string, unknown>)?.EventSource === 'aws:sns';
  }

  static readonly identifier = '__sns__';

  constructor(input: unknown) {
    super('sns');
    this._path = SNSHandler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = this.#distill(input);
    this._format = 'json';
  }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }

  #distill(input: unknown): unknown[] {
    const i = input as { Records: Array<{ Sns: { Message: string } }> };
    return i.Records.map(record => {
      try {
        return JSON.parse(record.Sns.Message);
      } catch {
        return record.Sns.Message;
      }
    });
  }
}
```

Note on `_path` typing: `KinesistHandler`, `S3Handler`, and `SNSHandler` set `_path` to the string identifier (not a `string[]`). This matches the JS source behaviour — the identifier string is used directly as the path for routing. The cast `as unknown as string[]` preserves that behaviour faithfully in the typed port.

- [ ] **Step 6: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/eventHandlers.test.ts
```

Expected: PASS — 10 tests green.

- [ ] **Step 7: Commit**

```bash
git add ts/src/handlers/KinesisHandler.ts ts/src/handlers/S3Handler.ts ts/src/handlers/SNSHandler.ts ts/src/__tests__/eventHandlers.test.ts
git commit -m "feat(ts): add KinesistHandler, S3Handler, SNSHandler"
```

---

## Task 9: handlers/console.ts

**Files:**
- Create: `ts/src/handlers/console.ts`
- Create: `ts/src/__tests__/console.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/console.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ConsoleHandler } from '../handlers/console.js';

describe('ConsoleHandler.parse', () => {
  it('parses plain path segments', () => {
    const { path, params, body } = ConsoleHandler.parse('v1 foo');
    expect(path).toEqual(['v1', 'foo']);
    expect(params).toEqual({});
    expect(body).toBeNull();
  });
  it('parses --key value pairs', () => {
    const { path, params } = ConsoleHandler.parse('v1 --page 2 --limit 10');
    expect(path).toEqual(['v1']);
    expect(params).toEqual({ page: '2', limit: '10' });
  });
  it('parses boolean flag (no value)', () => {
    const { params } = ConsoleHandler.parse('v1 --verbose');
    expect(params['verbose']).toBe(true);
  });
  it('parses JSON body at end of line', () => {
    const { body } = ConsoleHandler.parse("v1 post '{ \"x\": 1 }'");
    expect(body).toEqual({ x: 1 });
  });
  it('parses raw string body when not valid JSON', () => {
    const { body } = ConsoleHandler.parse('v1 rawbody');
    // 'rawbody' appears after path — treated as body since it's not a flag
    expect(body).toBe('rawbody');
  });
  it('handles empty line', () => {
    const { path, params, body } = ConsoleHandler.parse('');
    expect(path).toEqual([]);
    expect(params).toEqual({});
    expect(body).toBeNull();
  });
});

describe('ConsoleHandler', () => {
  it('sets handler type to console', () => {
    const h = new ConsoleHandler(['v1'], {}, 'get', null);
    expect(h.type).toBe('console');
  });
  it('sets _handler_type header', () => {
    const h = new ConsoleHandler(['v1'], {}, 'get', null);
    expect(h.headers['_handler_type']).toBe('console');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/console.test.ts
```

Expected: FAIL — `Cannot find module '../handlers/console.js'`

- [ ] **Step 3: Implement `ts/src/handlers/console.ts`**

```typescript
import { InputHandler } from './inputHandler.js';
import type { Response } from '../response.js';

export class ConsoleHandler extends InputHandler {
  constructor(path: string[], params: Record<string, unknown>, method: string, body: unknown) {
    super('console');
    this._path = path;
    this._params = params;
    this._method = method;
    this._payload = body;
    this._headers = { _handler_type: 'console' };
  }

  static parse(line: string): { path: string[]; params: Record<string, unknown>; body: unknown } {
    const tokens = ConsoleHandler.#tokenize(line.trim());
    const path: string[] = [];
    const params: Record<string, unknown> = {};
    let body: unknown = null;

    let i = 0;
    while (i < tokens.length && !tokens[i].startsWith('--')) {
      path.push(tokens[i]);
      i++;
    }

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

  static #tokenize(line: string): string[] {
    const tokens: string[] = [];
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

  processResponse(response: Response): void {
    const content = response.content;
    if (response.contentType?.startsWith('application/json')) {
      process.stdout.write(JSON.stringify(content, null, 2) + '\n');
    } else {
      process.stdout.write(String(content) + '\n');
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/console.test.ts
```

Expected: PASS — 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/handlers/console.ts ts/src/__tests__/console.test.ts
git commit -m "feat(ts): add ConsoleHandler with CLI parser"
```

---

## Task 10: handlers/handlers.ts

**Files:**
- Create: `ts/src/handlers/handlers.ts`
- Create: `ts/src/__tests__/handlers.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/handlers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { handlers } from '../handlers/handlers.js';
import { LambdaURLHandler } from '../handlers/lambdaURL.js';
import { KinesistHandler } from '../handlers/KinesisHandler.js';
import { SNSHandler } from '../handlers/SNSHandler.js';

describe('handlers.matchHandler', () => {
  it('returns LambdaURLHandler for Lambda URL input', () => {
    const input = {
      requestContext: { http: { method: 'GET', path: '/v1/foo' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    expect(handlers.matchHandler(input)).toBeInstanceOf(LambdaURLHandler);
  });
  it('returns KinesistHandler for Kinesis input', () => {
    const input = { Records: [{ eventSource: 'aws:kinesis' }] };
    expect(handlers.matchHandler(input)).toBeInstanceOf(KinesistHandler);
  });
  it('returns SNSHandler for SNS input', () => {
    const input = { Records: [{ EventSource: 'aws:sns', Sns: { Message: '{}' } }] };
    expect(handlers.matchHandler(input)).toBeInstanceOf(SNSHandler);
  });
  it('returns null when no handler matches', () => {
    expect(handlers.matchHandler({})).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/handlers.test.ts
```

Expected: FAIL — `Cannot find module '../handlers/handlers.js'`

- [ ] **Step 3: Implement `ts/src/handlers/handlers.ts`**

```typescript
import { InputHandler } from './inputHandler.js';
import { ExpressURLHandler } from './express.js';
import { LambdaURLHandler } from './lambdaURL.js';
import { AmazonConnectHandler } from './amazonConnect.js';
import { KinesistHandler } from './KinesisHandler.js';
import { S3Handler } from './S3Handler.js';
import { SNSHandler } from './SNSHandler.js';

export const handlers = {
  matchHandler(input: unknown): InputHandler | null {
    if (LambdaURLHandler.isLambdaURL(input)) return new LambdaURLHandler(input as Record<string, unknown>);
    if (ExpressURLHandler.isExpressURL(input)) return new ExpressURLHandler(input as Record<string, unknown>);
    if (AmazonConnectHandler.isAmazonConnect(input)) return new AmazonConnectHandler(input as Record<string, unknown>);
    if (KinesistHandler.isKinesis(input)) return new KinesistHandler(input);
    if (S3Handler.isS3(input)) return new S3Handler(input);
    if (SNSHandler.isSNS(input)) return new SNSHandler(input);
    return null;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/handlers.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/handlers/handlers.ts ts/src/__tests__/handlers.test.ts
git commit -m "feat(ts): add handler registry"
```

---

## Task 11: aws/Kinesis.ts

**Files:**
- Create: `ts/src/aws/Kinesis.ts`
- Create: `ts/src/__tests__/Kinesis.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/Kinesis.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { KinesisRecords, KinesisRecord } from '../aws/Kinesis.js';

const makeRecord = (data: unknown) => ({
  eventSource: 'aws:kinesis',
  eventSourceARN: 'arn:aws:kinesis:us-east-1:123:stream/MyStream',
  eventName: 'aws:kinesis:record',
  kinesis: {
    data: Buffer.from(JSON.stringify(data)).toString('base64'),
  },
});

describe('KinesisRecords', () => {
  it('wraps records array', () => {
    const payload = { Records: [makeRecord({ x: 1 }), makeRecord({ x: 2 })] };
    const kr = new KinesisRecords(payload);
    expect(kr.records).toHaveLength(2);
  });
  it('returns empty array when Records missing', () => {
    expect(new KinesisRecords({}).records).toHaveLength(0);
  });
  it('getRecord returns record by index', () => {
    const payload = { Records: [makeRecord({ x: 1 })] };
    const kr = new KinesisRecords(payload);
    expect(kr.getRecord(0)).toBeInstanceOf(KinesisRecord);
  });
});

describe('KinesisRecord', () => {
  it('throws when eventSource is not aws:kinesis', () => {
    expect(() => new KinesisRecord({ eventSource: 'aws:s3' })).toThrow('Not a Kinesis record');
  });
  it('exposes source and name', () => {
    const r = new KinesisRecord(makeRecord({ ok: true }));
    expect(r.source).toBe('arn:aws:kinesis:us-east-1:123:stream/MyStream');
    expect(r.name).toBe('aws:kinesis:record');
  });
  it('decodes and parses base64 data', () => {
    const r = new KinesisRecord(makeRecord({ value: 42 }));
    expect(r.data).toEqual({ value: 42 });
  });
  it('returns null when data is not valid JSON', () => {
    const badRecord = {
      eventSource: 'aws:kinesis',
      eventSourceARN: 'arn:x',
      eventName: 'test',
      kinesis: { data: Buffer.from('not-json').toString('base64') },
    };
    expect(new KinesisRecord(badRecord).data).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/Kinesis.test.ts
```

Expected: FAIL — `Cannot find module '../aws/Kinesis.js'`

- [ ] **Step 3: Implement `ts/src/aws/Kinesis.ts`**

```typescript
interface RawKinesisRecord {
  eventSource: string;
  eventSourceARN: string;
  eventName: string;
  kinesis?: { data: string };
}

export class KinesisRecords {
  readonly #records: KinesisRecord[];
  get records(): KinesisRecord[] { return this.#records; }

  constructor(payload: unknown) {
    const p = payload as { Records?: RawKinesisRecord[] };
    this.#records = (p?.Records || []).map(record => new KinesisRecord(record));
  }

  getRecord(index: number): KinesisRecord {
    return this.#records[index];
  }
}

export class KinesisRecord {
  readonly #record: RawKinesisRecord;
  get record(): RawKinesisRecord { return this.#record; }

  constructor(record: unknown) {
    const r = record as RawKinesisRecord;
    if (r.eventSource !== 'aws:kinesis') {
      throw new Error('Not a Kinesis record');
    }
    this.#record = r;
  }

  get source(): string { return this.#record.eventSourceARN; }
  get name(): string { return this.#record.eventName; }

  get data(): unknown {
    try {
      const buf = Buffer.from(this.#record.kinesis?.data ?? '', 'base64');
      const str = buf.toString('utf-8');
      return JSON.parse(str);
    } catch (err) {
      console.error('Error parsing Kinesis record data', err);
      return null;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/Kinesis.test.ts
```

Expected: PASS — 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/aws/Kinesis.ts ts/src/__tests__/Kinesis.test.ts
git commit -m "feat(ts): add typed KinesisRecords and KinesisRecord wrappers"
```

---

## Task 12: notifications/NotificationChannel.ts

**Files:**
- Create: `ts/src/notifications/NotificationChannel.ts`
- Create: `ts/src/__tests__/NotificationChannel.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/NotificationChannel.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationChannel } from '../notifications/NotificationChannel.js';

describe('NotificationChannel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes url', () => {
    const nc = new NotificationChannel('https://hooks.example.com/abc');
    expect(nc.url).toBe('https://hooks.example.com/abc');
  });

  it('posts message to url and returns sent status', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: true } as Response);

    const nc = new NotificationChannel('https://hooks.example.com/abc');
    const result = await nc.notify('hello world') as { status: string };
    expect(result.status).toBe('sent');
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://hooks.example.com/abc');
    const body = JSON.parse(opts.body as string) as { text: string };
    expect(body.text).toBe('"hello world"');
  });

  it('includes threadKey when threadkey provided', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const nc = new NotificationChannel('https://hooks.example.com/abc');
    await nc.notify('msg', 'thread-1');
    const [, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string) as { thread: { threadKey: string } };
    expect(body.thread.threadKey).toBe('thread-1');
  });

  it('returns not_sent on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    const nc = new NotificationChannel('https://hooks.example.com/abc');
    const result = await nc.notify('msg') as { status: string; reason: string };
    expect(result.status).toBe('not_sent');
    expect(result.reason).toBe('network down');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/NotificationChannel.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ts/src/notifications/NotificationChannel.ts`**

```typescript
export class NotificationChannel {
  readonly #notificationUrl: string | null;
  get url(): string | null { return this.#notificationUrl; }

  constructor(notificationUrl: string | null = null) {
    this.#notificationUrl = notificationUrl;
  }

  async notify(message: unknown, threadkey: string | null = null): Promise<unknown> {
    let text: string;
    try { text = JSON.stringify(message); } catch { text = String(message); }
    const body: Record<string, unknown> = { text };
    if (threadkey) body['thread'] = { threadKey: threadkey };
    try {
      const response = await fetch(this.#notificationUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { status: 'sent', response };
    } catch (err) {
      console.error('Failed to send notification', err);
      return { status: 'not_sent', reason: (err as Error).message };
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/NotificationChannel.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/notifications/NotificationChannel.ts ts/src/__tests__/NotificationChannel.test.ts
git commit -m "feat(ts): add NotificationChannel webhook notifier"
```

---

## Task 13: notifications/SNSPublisher.ts

**Files:**
- Create: `ts/src/notifications/SNSPublisher.ts`
- Create: `ts/src/__tests__/SNSPublisher.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/SNSPublisher.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AWS SDK modules before importing SNSPublisher
vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ MessageId: 'mock-id' }),
  })),
  PublishCommand: vi.fn().mockImplementation((input) => ({ input })),
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromIni: vi.fn().mockReturnValue({ accessKeyId: 'test', secretAccessKey: 'test' }),
}));

import { SNSPublisher } from '../notifications/SNSPublisher.js';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

describe('SNSPublisher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.SNS_ARN_PREFIX;
    delete process.env.AWS_PROFILE;
  });

  it('builds topic ARN from prefix + topic', () => {
    process.env.SNS_ARN_PREFIX = 'arn:aws:sns:us-east-1:123:';
    const p = new SNSPublisher('my-topic');
    expect(p.topic).toBe('arn:aws:sns:us-east-1:123:my-topic');
  });

  it('uses fromIni credentials when not in Lambda', async () => {
    process.env.SNS_ARN_PREFIX = 'arn:prefix:';
    const p = new SNSPublisher('topic');
    await p.publish({ event: 'test' });
    expect(SNSClient).toHaveBeenCalledWith(
      expect.objectContaining({ credentials: expect.anything() })
    );
  });

  it('skips fromIni credentials when in Lambda', async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-function';
    process.env.SNS_ARN_PREFIX = 'arn:prefix:';
    const p = new SNSPublisher('topic');
    await p.publish({ event: 'test' });
    const callArg = vi.mocked(SNSClient).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg['credentials']).toBeUndefined();
  });

  it('publish sends a PublishCommand with JSON-stringified message', async () => {
    process.env.SNS_ARN_PREFIX = 'arn:prefix:';
    const p = new SNSPublisher('topic');
    await p.publish({ event: 'order.placed' });
    expect(PublishCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Message: JSON.stringify({ event: 'order.placed' }) })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/SNSPublisher.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ts/src/notifications/SNSPublisher.ts`**

```typescript
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { fromIni } from '@aws-sdk/credential-providers';

export class SNSPublisher {
  readonly #topic: string;
  get topic(): string { return this.#topic; }

  readonly #client: SNSClient;
  get client(): SNSClient { return this.#client; }

  constructor(topic: string | null = null) {
    this.#topic = (process.env.SNS_ARN_PREFIX ?? '') + (topic ?? '');

    const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const config: ConstructorParameters<typeof SNSClient>[0] = {
      region: process.env.AWS_REGION,
    };
    if (!isLambda) {
      config.credentials = fromIni({ profile: process.env.AWS_PROFILE });
    }
    this.#client = new SNSClient(config);
  }

  async publish(message: unknown): Promise<unknown> {
    const command = new PublishCommand({
      TopicArn: this.#topic,
      Message: JSON.stringify(message),
    });
    return await this.#client.send(command);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/SNSPublisher.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/notifications/SNSPublisher.ts ts/src/__tests__/SNSPublisher.test.ts
git commit -m "feat(ts): add SNSPublisher with typed AWS SDK"
```

---

## Task 14: API.ts

**Files:**
- Create: `ts/src/API.ts`
- Create: `ts/src/__tests__/API.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/API.test.ts`:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';
import { NotFoundError, AuthError } from '../errors.js';

const makeSimpleAPI = () =>
  new APIInterface({
    hello: {
      method: 'get',
      action: async () => new ResponseJSON({ message: 'world' }),
    },
    greet: {
      method: 'post',
      action: async (_p, body) => new ResponseJSON({ echo: body }),
    },
  });

describe('APIInterface.execute', () => {
  it('resolves a leaf node and returns its response', async () => {
    const api = makeSimpleAPI();
    const r = await api.execute(['hello'], {}, 'GET', null);
    expect(r.contentType).toBe('application/json');
    expect((r as unknown as { content: unknown }).content).toEqual({ message: 'world' });
  });
  it('throws NotFoundError for unknown path', async () => {
    await expect(makeSimpleAPI().execute(['missing'], {}, 'GET', null)).rejects.toThrow(NotFoundError);
  });
  it('passes body to action', async () => {
    const api = makeSimpleAPI();
    const r = await api.execute(['greet'], {}, 'POST', { name: 'Alice' });
    expect((r as unknown as { content: unknown }).content).toEqual({ echo: { name: 'Alice' } });
  });
  it('accepts string path (non-array)', async () => {
    const api = makeSimpleAPI();
    const r = await api.execute('hello', {}, 'GET', null);
    expect((r as unknown as { content: unknown }).content).toEqual({ message: 'world' });
  });
});

describe('APIInterface.addHandler', () => {
  it('registers a new endpoint reachable via execute', async () => {
    const api = makeSimpleAPI();
    api.addHandler('added', async () => new ResponseJSON({ added: true }));
    const r = await api.execute(['added'], {}, 'POST', null);
    expect((r as unknown as { content: unknown }).content).toEqual({ added: true });
  });
});

describe('APIInterface.isAPIInterface', () => {
  it('returns true', () => {
    expect(makeSimpleAPI().isAPIInterface).toBe(true);
  });
});

describe('APIInterface.resolveMethod', () => {
  it('returns the declared method of the terminal node', async () => {
    const api = makeSimpleAPI();
    expect(await api.resolveMethod(['hello'])).toBe('get');
    expect(await api.resolveMethod(['greet'])).toBe('post');
  });
  it('defaults to get when no method declared', async () => {
    const api = new APIInterface({ foo: { action: async () => new ResponseJSON({}) } });
    expect(await api.resolveMethod(['foo'])).toBe('get');
  });
  it('returns get for unknown path', async () => {
    expect(await makeSimpleAPI().resolveMethod(['unknown'])).toBe('get');
  });
});

describe('APIInterface schema restriction', () => {
  afterEach(() => {
    delete process.env.ALLOW_API;
    delete process.env.DENY_API;
  });

  it('exposes all toplevel api nodes by default', () => {
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
      b: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(api.schema['a']).toBeDefined();
    expect(api.schema['b']).toBeDefined();
  });

  it('restricts to ALLOW_API list', () => {
    process.env.ALLOW_API = 'a';
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
      b: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(api.schema['a']).toBeDefined();
    expect(api.schema['b']).toBeUndefined();
  });

  it('blocks nodes in DENY_API list', () => {
    process.env.DENY_API = 'b';
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
      b: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(api.schema['a']).toBeDefined();
    expect(api.schema['b']).toBeUndefined();
  });

  it('returns empty schema when DENY_API=all', () => {
    process.env.DENY_API = 'all';
    const api = new APIInterface({
      a: { api: true, toplevel: true, action: async () => new ResponseJSON({}) },
    });
    expect(Object.keys(api.schema)).toHaveLength(0);
  });
});

describe('APIInterface.confirmAPIKey', () => {
  it('does not throw when no apiKey configured', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({}, undefined)).not.toThrow();
  });
  it('throws AuthError when key missing', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({}, 'secret')).toThrow(AuthError);
  });
  it('throws AuthError when key wrong', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({ 'x-api-key': 'wrong' }, 'secret')).toThrow(AuthError);
  });
  it('does not throw when key matches', () => {
    expect(() => makeSimpleAPI().confirmAPIKey({ 'x-api-key': 'secret' }, 'secret')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/API.test.ts
```

Expected: FAIL — `Cannot find module '../API.js'`

- [ ] **Step 3: Implement `ts/src/API.ts`**

```typescript
import type { Response } from './response.js';
import { ResponseJSON } from './response.js';
import OpenAPI from './OpenAPI.js';
import { AuthError, NotFoundError } from './errors.js';

export interface ParamDefinition {
  in?: 'query' | 'path' | 'header';
  type?: string;
  required?: boolean;
  default?: unknown;
  description?: string;
}

export type ActionResult = Promise<Response | APIInterface>;

export interface SchemaNode {
  method?: string;
  summary?: string;
  description?: string;
  tag?: string;
  api?: boolean;
  toplevel?: boolean;
  params?: Record<string, ParamDefinition>;
  body?: object;
  responses?: Record<string, { description: string }>;
  action: (
    params: Record<string, unknown>,
    body: unknown,
    headers: Record<string, string>
  ) => ActionResult;
}

export type Schema = Record<string, SchemaNode>;

export class APIInterface {
  #schema: Schema;
  get schema(): Schema { return this.#schema; }

  readonly #title: string;
  readonly #version: string;

  constructor(schema: Schema = {}, title = 'API Documentation', version = 'Unknown') {
    this.#schema = this.#restrictSchema(schema);
    this.#title = `${title} (${process.env.AWS_LAMBDA_FUNCTION_NAME || 'Local'})`;
    this.#version = version;
  }

  get isAPIInterface(): boolean { return true; }

  async execute(
    path: string | string[],
    params: Record<string, unknown>,
    methods: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    if (!Array.isArray(path)) path = [path];
    const pathinit = path.join('/');
    const node = await this.exrec([...path], params, methods, body, headers);
    if ((node as APIInterface)?.isAPIInterface === true) {
      return (node as APIInterface).usage(pathinit, this.#schema[pathinit]?.params);
    }
    return node as Response;
  }

  async exrec(
    path: string[],
    params: Record<string, unknown>,
    _methods: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<Response | APIInterface> {
    let currentAPI: APIInterface = this;
    while (path.length > 0) {
      const pathElement = path.splice(0, 1)[0];
      const schemaNode = currentAPI.#schema[pathElement];
      if (!schemaNode) throw new NotFoundError(pathElement + ' not found');

      if (schemaNode.params && Object.keys(schemaNode.params).length > 0) {
        for (const key of Object.keys(schemaNode.params)) {
          if (schemaNode.params[key]?.in === 'path') {
            params[key] = path.splice(0, 1)[0];
          }
        }
      }
      const result = await schemaNode.action(params, body, headers);
      if (path.length === 0) return result;
      if (!(result instanceof APIInterface)) {
        throw new NotFoundError(pathElement + ' not found');
      }
      currentAPI = result;
    }
    return currentAPI;
  }

  async usage(path: string, params: Record<string, ParamDefinition> = {}): Promise<Response> {
    const d = await new OpenAPI(this, this.#title, this.#version, path, params).json();
    return new ResponseJSON(d);
  }

  addHandler(key: string, handler: SchemaNode['action']): void {
    this.#schema[key] = {
      method: 'post',
      action: handler,
    };
  }

  addLambdaSimulator(simulator: () => Promise<APIInterface>): void {
    const allowList = process.env.ALLOW_API?.split(',').map(s => s.trim()) || ['all'];
    const denyList = process.env.DENY_API?.split(',').map(s => s.trim()) || [];
    if (denyList.indexOf('lambda') >= 0) return;
    if (allowList.indexOf('all') < 0 && allowList.indexOf('lambda') < 0) return;
    this.#schema['lambda'] = {
      api: true,
      toplevel: true,
      tag: 'Lambda Simulator',
      description: 'Simulate Lambda invocation using REST API',
      action: simulator,
    };
  }

  #restrictSchema(schema: Schema): Schema {
    const allowList = process.env.ALLOW_API?.split(',').map(s => s.trim()) || null;
    const denyList = process.env.DENY_API?.split(',').map(s => s.trim()) || [];
    if (denyList[0]?.toLowerCase() === 'all') return {};
    for (const key of Object.keys(schema)) {
      if (schema[key].api && schema[key].toplevel) {
        if ((allowList && allowList.indexOf(key) < 0) || denyList.indexOf(key) >= 0) {
          delete schema[key];
        }
      }
    }
    return schema;
  }

  async resolveMethod(path: string | string[]): Promise<string> {
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
          if ((next as APIInterface)?.isAPIInterface) {
            currentSchema = (next as APIInterface).schema;
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

  confirmAPIKey(headers: Record<string, string>, apiKey: string | undefined): void {
    if (apiKey) {
      const provided = headers['x-api-key'];
      if (!provided || provided !== apiKey) {
        throw new AuthError('Invalid or missing API key');
      }
    }
  }
}
```

- [ ] **Step 4: Create a stub `ts/src/OpenAPI.ts`** (needed for API.ts to compile before Task 15)

```typescript
import type { APIInterface, ParamDefinition } from './API.js';

export default class OpenAPI {
  constructor(
    _api: APIInterface,
    _title: string,
    _version: string,
    _path: string,
    _params: Record<string, ParamDefinition>
  ) {}

  async json(): Promise<Record<string, unknown>> {
    return {};
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/API.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add ts/src/API.ts ts/src/OpenAPI.ts ts/src/__tests__/API.test.ts
git commit -m "feat(ts): add APIInterface with schema types and routing"
```

---

## Task 15: OpenAPI.ts (full implementation)

**Files:**
- Modify: `ts/src/OpenAPI.ts` (replace stub)
- Create: `ts/src/__tests__/OpenAPI.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/OpenAPI.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';
import OpenAPI from '../OpenAPI.js';

const makeAPI = () =>
  new APIInterface({
    items: {
      method: 'get',
      summary: 'List items',
      description: 'Returns all items',
      tag: 'Items',
      action: async () => new ResponseJSON([]),
    },
    create: {
      method: 'post',
      body: { properties: { name: { type: 'string' } } },
      action: async () => new ResponseJSON({}),
    },
  });

describe('OpenAPI.json', () => {
  it('returns a valid OpenAPI 3.0 document', async () => {
    const doc = await new OpenAPI(makeAPI(), 'Test API', '1.0.0', '/', {}).json();
    expect(doc['openapi']).toBe('3.0.0');
    expect((doc['info'] as Record<string, string>)['title']).toBe('Test API');
    expect((doc['info'] as Record<string, string>)['version']).toBe('1.0.0');
  });

  it('includes paths for each schema node', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    const paths = doc['paths'] as Record<string, unknown>;
    expect(paths['/items']).toBeDefined();
    expect(paths['/create']).toBeDefined();
  });

  it('uses declared HTTP method as key', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    const paths = doc['paths'] as Record<string, Record<string, unknown>>;
    expect(paths['/items']['get']).toBeDefined();
    expect(paths['/create']['post']).toBeDefined();
  });

  it('includes requestBody when body defined', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    const paths = doc['paths'] as Record<string, Record<string, Record<string, unknown>>>;
    expect(paths['/create']['post']['requestBody']).toBeDefined();
  });

  it('includes securitySchemes component', async () => {
    const doc = await new OpenAPI(makeAPI(), 'T', '1', '/', {}).json();
    const schemes = (doc['components'] as Record<string, unknown>)['securitySchemes'];
    expect(schemes).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails (stub returns `{}` for paths)**

```bash
cd ts && npx vitest run src/__tests__/OpenAPI.test.ts
```

Expected: FAIL — paths is `{}`, assertions on `/items` fail.

- [ ] **Step 3: Implement full `ts/src/OpenAPI.ts`**

```typescript
import { APIInterface, type ParamDefinition, type Schema, type SchemaNode } from './API.js';

export default class OpenAPI {
  readonly #api: APIInterface;
  readonly #path: string;
  readonly #hparams: Record<string, ParamDefinition>;
  readonly #title: string;
  readonly #version: string;

  constructor(
    api: APIInterface,
    title: string,
    version: string,
    path = '/',
    hparams: Record<string, ParamDefinition> = {}
  ) {
    this.#api = api;
    this.#path = path.startsWith('/') ? path : '/' + path;
    this.#hparams = hparams;
    this.#title = title || 'API Documentation';
    this.#version = version || '1.0.0';
  }

  async json(): Promise<Record<string, unknown>> {
    const doc: Record<string, unknown> = {
      openapi: '3.0.0',
      info: { title: this.#title, version: this.#version },
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
        },
      },
    };
    doc['paths'] = await this.#generatePaths(this.#api, this.#path, this.#hparams);
    doc['tags'] = await this.#generateTags(this.#api, this.#path);
    return doc;
  }

  async #generatePaths(
    node: APIInterface,
    root: string,
    hparams: Record<string, ParamDefinition>,
    tag: string | null = null
  ): Promise<Record<string, unknown>> {
    let paths: Record<string, unknown> = {};
    const localHparams = { ...hparams };

    for (const [key, value] of Object.entries(node.schema)) {
      let path = `${root}/${key}`;
      const method = value.method || 'get';

      const params = [
        ...Object.entries(localHparams).map(([paramName, paramDetails]) => ({
          name: paramName,
          in: paramDetails.in || 'path',
          required: paramDetails.required || false,
          schema: { type: paramDetails.type || 'string' },
          description: paramDetails.description || '',
        })),
        ...Object.entries(value.params || {}).map(([paramName, paramDetails]) => ({
          name: paramName,
          in: paramDetails.in || 'query',
          required: paramDetails.required || false,
          default: paramDetails.default,
          schema: { type: paramDetails.type || 'string' },
          description: paramDetails.description || '',
        })),
      ];

      const responses = value.responses || { '200': { description: 'Successful response' } };
      let entry: Record<string, unknown> = {
        summary: value.summary || '',
        description: value.description || '',
        operationId: this.#slug(path),
        tags: tag ? [tag] : [],
        parameters: params,
        responses,
      };
      if (responses['401'] || responses[401]) {
        entry['security'] = [{ ApiKeyAuth: [] }];
      }
      if (value.body) {
        entry['requestBody'] = {
          content: { 'application/json': { schema: value.body } },
        };
      }
      const methodEntry = { [method.toLowerCase()]: entry };

      if (value.api === true && typeof value.action === 'function') {
        let prms: string[] | null = null;
        if (value.params) {
          prms = [];
          for (const [paramName, paramDetails] of Object.entries(value.params)) {
            if (paramDetails.in === 'path') path += `/{${paramName}}`;
            prms.push(paramName);
            localHparams[paramName] = paramDetails;
          }
        }
        const inner = await this.#generatePaths(
          (await value.action(prms ? Object.fromEntries(prms.map(p => [p, p])) : {}, null, {})) as APIInterface,
          path,
          localHparams,
          value.tag ?? null
        );
        if (value.params) {
          for (const paramName of Object.keys(value.params)) delete localHparams[paramName];
        }
        Object.assign(paths, inner);
      } else {
        paths[path] = methodEntry;
      }
    }
    return paths;
  }

  async #generateTags(node: APIInterface, root: string): Promise<unknown[]> {
    let tags: unknown[] = [];
    for (const [key, value] of Object.entries(node.schema)) {
      let path = `${root}/${key}`;
      if (value.api === true && typeof value.action === 'function') {
        tags.push({ name: value.tag || path, description: value.description || '' });
        let prms: Record<string, unknown> = {};
        if (value.params) {
          for (const [paramName, paramDetails] of Object.entries(value.params)) {
            if (paramDetails.in === 'path') path += `/{${paramName}}`;
            prms[paramName] = paramName;
          }
        }
        const inner = await this.#generateTags(
          (await value.action(prms, null, {})) as APIInterface,
          path
        );
        tags = [...tags, ...inner];
      }
    }
    return tags;
  }

  #slug(path: string): string {
    if (path.startsWith('/')) path = path.slice(1);
    if (path.endsWith('/')) path = path.slice(0, -1);
    return path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/OpenAPI.test.ts
```

Expected: PASS — 5 tests green.

- [ ] **Step 5: Also re-run API tests to confirm no regression**

```bash
cd ts && npx vitest run src/__tests__/API.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ts/src/OpenAPI.ts ts/src/__tests__/OpenAPI.test.ts
git commit -m "feat(ts): implement full OpenAPI 3.0 document generator"
```

---

## Task 16: LambdaSimulatorAPI.ts

**Files:**
- Create: `ts/src/LambdaSimulatorAPI.ts`
- Create: `ts/src/__tests__/LambdaSimulatorAPI.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/LambdaSimulatorAPI.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { LambdaSimulatorAPI } from '../LambdaSimulatorAPI.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeTargetAPI = () =>
  new APIInterface({
    hello: { method: 'get', action: async () => new ResponseJSON({ ok: true }) },
  });

describe('LambdaSimulatorAPI', () => {
  it('is an APIInterface', () => {
    const sim = new LambdaSimulatorAPI(makeTargetAPI(), '1.0.0');
    expect(sim.isAPIInterface).toBe(true);
  });
  it('exposes a simulate endpoint', () => {
    const sim = new LambdaSimulatorAPI(makeTargetAPI(), '1.0.0');
    expect(sim.schema['simulate']).toBeDefined();
    expect(sim.schema['simulate'].method).toBe('post');
  });
  it('simulate action invokes handleLambdaTrigger and returns ResponseJSON', async () => {
    const sim = new LambdaSimulatorAPI(makeTargetAPI(), '1.0.0');
    // Pass a Lambda URL event that routes to /hello
    const lambdaInput = {
      requestContext: { http: { method: 'GET', path: '/hello' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    const result = await sim.schema['simulate'].action({}, lambdaInput, {});
    expect((result as ResponseJSON).contentType).toBe('application/json');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/LambdaSimulatorAPI.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ts/src/LambdaSimulatorAPI.ts`**

```typescript
import { ResponseJSON } from './response.js';
import { APIInterface } from './API.js';
import { handleLambdaTrigger } from './lambdaHandler.js';

export class LambdaSimulatorAPI extends APIInterface {
  constructor(api: APIInterface, version = 'unknown') {
    super(
      {
        simulate: {
          method: 'post',
          summary: 'Simulate a raw lambda trigger',
          description: 'Simulate a lambda trigger for testing purposes',
          body: { properties: {} },
          action: async (_params, body) => {
            const result = await handleLambdaTrigger(body, api);
            return new ResponseJSON(result);
          },
          tag: 'Debug',
        },
      },
      'Lambda Simulator',
      version
    );
  }
}
```

- [ ] **Step 4: Create a stub `ts/src/lambdaHandler.ts`** (needed for LambdaSimulatorAPI to compile before Task 17)

```typescript
import type { APIInterface } from './API.js';

export async function handleLambdaTrigger(input: unknown, _target: APIInterface): Promise<unknown> {
  return { statusCode: 200, body: JSON.stringify(input) };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/LambdaSimulatorAPI.test.ts
```

Expected: PASS — 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add ts/src/LambdaSimulatorAPI.ts ts/src/lambdaHandler.ts ts/src/__tests__/LambdaSimulatorAPI.test.ts
git commit -m "feat(ts): add LambdaSimulatorAPI"
```

---

## Task 17: lambdaHandler.ts (full implementation)

**Files:**
- Modify: `ts/src/lambdaHandler.ts` (replace stub)
- Create: `ts/src/__tests__/lambdaHandler.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/lambdaHandler.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleLambdaTrigger } from '../lambdaHandler.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeAPI = () =>
  new APIInterface({
    hello: { method: 'get', action: async () => new ResponseJSON({ msg: 'hi' }) },
  });

describe('handleLambdaTrigger', () => {
  it('returns 400 when no handler matches input', async () => {
    const result = await handleLambdaTrigger({}, makeAPI()) as { statusCode: number; body: string };
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Input not recognized');
  });

  it('routes a Lambda URL GET request to the correct handler', async () => {
    const input = {
      requestContext: { http: { method: 'GET', path: '/hello' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    const result = await handleLambdaTrigger(input, makeAPI()) as { statusCode: number; body: string };
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ msg: 'hi' });
  });

  it('returns CORS headers for OPTIONS preflight', async () => {
    const input = {
      requestContext: { http: { method: 'OPTIONS', path: '/hello' } },
      queryStringParameters: {},
      body: null,
      headers: {
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'content-type',
      },
    };
    const result = await handleLambdaTrigger(input, makeAPI()) as {
      statusCode: number;
      headers: Record<string, string>;
    };
    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('returns 404 JSON when NotFoundError thrown', async () => {
    const input = {
      requestContext: { http: { method: 'GET', path: '/missing' } },
      queryStringParameters: {},
      body: null,
      headers: {},
    };
    const result = await handleLambdaTrigger(input, makeAPI()) as { statusCode: number; body: string };
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toMatchObject({ type: 'NotFoundError' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails (stub returns 200 always)**

```bash
cd ts && npx vitest run src/__tests__/lambdaHandler.test.ts
```

Expected: FAIL — routing test returns stub response, not real routing.

- [ ] **Step 3: Implement full `ts/src/lambdaHandler.ts`**

```typescript
import { handlers } from './handlers/handlers.js';
import { BaseError } from './errors.js';
import { APIInterface } from './API.js';
import fs from 'fs';
import mime from 'mime-types';

export const handleLambdaTrigger = async (input: unknown, target: APIInterface): Promise<unknown> => {
  const handler = handlers.matchHandler(input);
  if (!handler) {
    console.error('No handler found for input');
    console.log('INPUT', JSON.stringify(input));
    return { statusCode: 400, body: 'Input not recognized' };
  }

  let headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
  };

  if (handler.method.toLowerCase() === 'options') {
    const reqHeaders = handler.headers as Record<string, string>;
    headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': reqHeaders['access-control-request-method'],
      'Access-Control-Allow-Headers': reqHeaders['access-control-request-headers'],
    };
    console.log('CORS request service');
    return { statusCode: 200, headers };
  }

  const path = handler.path as string[];
  if (path[0] === 'docs') {
    let filename: string;
    let contentType: string;
    if (path.length > 1) {
      filename = path.slice(1).join('/');
      const format = handler.format;
      if (format) {
        filename += '.' + format;
        contentType = mime.lookup(filename) || 'application/octet-stream';
      } else {
        contentType = 'application/octet-stream';
      }
    } else {
      filename = 'index.html';
      contentType = 'text/html';
    }
    filename = process.cwd() + '/node_modules/ishell.js/swagger/' + filename;
    const data = fs.readFileSync(filename);
    console.log('Docs file', filename, data.length);
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Content-Source': 'static',
      },
      body: data.toString(),
    };
  }

  const requestHeaders = { ...handler.headers, _handler_type: handler.type };

  try {
    if (process.env.AWS_LOG_IO === 'true') {
      console.log('INPUT', JSON.stringify(input));
    } else {
      console.log(handler.shortInputLog(input));
    }
    const response = await target.execute(
      path,
      handler.params as Record<string, unknown>,
      handler.method,
      handler.payload,
      requestHeaders
    );
    return handler.processResponse(response, headers);
  } catch (err) {
    console.log('INPUT', JSON.stringify(input));
    if (err instanceof BaseError) {
      return {
        statusCode: err.statusCode,
        headers,
        body: JSON.stringify({ error: err.message, type: err.name }),
      };
    }
    const msg = (err as Error).message;
    const params = handler.params as Record<string, unknown>;
    const trace =
      params['stacktrace'] !== 'false'
        ? (err as Error).stack?.split('\n').slice(1).map(line => line.trim())
        : undefined;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: msg, stack: trace }) || 'Internal Application Error',
    };
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/lambdaHandler.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/lambdaHandler.ts ts/src/__tests__/lambdaHandler.test.ts
git commit -m "feat(ts): implement Lambda trigger handler and dispatcher"
```

---

## Task 18: localServer.ts

**Files:**
- Create: `ts/src/localServer.ts`
- Create: `ts/src/__tests__/localServer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/localServer.test.ts`:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import http from 'http';
import { localServer } from '../localServer.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeAPI = () =>
  new APIInterface({
    ping: { method: 'get', action: async () => new ResponseJSON({ pong: true }) },
    echo: { method: 'post', action: async (_p, body) => new ResponseJSON({ echoed: body }) },
  });

let server: http.Server | null = null;

afterEach(async () => {
  if (server) {
    await new Promise<void>(resolve => server!.close(() => resolve()));
    server = null;
  }
});

const get = (port: number, path: string): Promise<{ status: number; body: string }> =>
  new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    }).on('error', reject);
  });

describe('localServer', () => {
  it('starts and responds to GET requests', async () => {
    process.env.PORT = '19876';
    server = await localServer(makeAPI()) as http.Server;
    const { status, body } = await get(19876, '/ping');
    expect(status).toBe(200);
    expect(JSON.parse(body)).toEqual({ pong: true });
  });

  it('returns 404 JSON for unknown paths', async () => {
    process.env.PORT = '19877';
    server = await localServer(makeAPI()) as http.Server;
    const { status, body } = await get(19877, '/unknown');
    expect(status).toBe(404);
    expect(JSON.parse(body)).toMatchObject({ status: 'error', type: 'NotFoundError' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/localServer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ts/src/localServer.ts`**

```typescript
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response as ExpressResponse } from 'express';
import path from 'path';
import { BaseError } from './errors.js';
import { ResponseJSON } from './response.js';
import type { Response } from './response.js';
import type { APIInterface } from './API.js';
import http from 'http';

export const localServer = (target: APIInterface): Promise<http.Server> => {
  const app = express();

  app.use(express.json());
  app.use(cors());

  app.use(
    '/docs',
    express.static(path.join(process.cwd(), 'node_modules/ishell.js/swagger'))
  );

  const serveMethod = async (req: Request, res: ExpressResponse): Promise<void> => {
    let reqPath = req.path;
    if (reqPath.startsWith('/')) reqPath = reqPath.slice(1);
    if (reqPath.endsWith('/')) reqPath = reqPath.slice(0, -1);
    const pos = reqPath.lastIndexOf('.');
    if (pos > 0) reqPath = reqPath.slice(0, pos);
    const response = await httpHandler(
      reqPath.split('/'),
      req.query as Record<string, string>,
      req.method,
      req.headers as Record<string, string>,
      req.body as unknown
    );
    res.type(response.contentType).status(response.returnCode).send(response.content);
  };

  const httpHandler = async (
    pathSegments: string[],
    params: Record<string, unknown>,
    method: string,
    headers: Record<string, string>,
    body: unknown = null
  ): Promise<Response> => {
    const enrichedHeaders = { ...headers, _handler_type: 'express' };
    try {
      if (body !== null) {
        let payload: unknown;
        try { payload = JSON.parse(body as string); } catch { payload = body; }
        return await target.execute(pathSegments, params, method, payload, enrichedHeaders);
      } else {
        return await target.execute(pathSegments, params, method, undefined, enrichedHeaders);
      }
    } catch (err) {
      const trace = (err as Error).stack?.split('\n').slice(1).map(line => line.trim());
      if (err instanceof BaseError) {
        return new ResponseJSON({ status: 'error', type: err.name, message: err.message }).errorCode(err.statusCode);
      }
      return new ResponseJSON({ status: 'error', error: (err as Error).message, stack: trace }).errorCode(500);
    }
  };

  app.get(/.*/, (req, res) => { void serveMethod(req, res); });
  app.post(/.*/, (req, res) => { void serveMethod(req, res); });
  app.put(/.*/, (req, res) => { void serveMethod(req, res); });
  app.patch(/.*/, (req, res) => { void serveMethod(req, res); });
  app.delete(/.*/, (req, res) => { void serveMethod(req, res); });

  dotenv.config();

  const PORT = parseInt(process.env.PORT || '3001', 10);
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      const host = `http://localhost:${PORT}/`;
      console.log(`Express server running on ${host}`);
      for (const [key, t] of Object.entries(target.schema)) {
        if (t.api) console.log(`For ${t.tag} API\tgo to  ${host}docs/?root=${key}`);
      }
      resolve(server);
    });
    server.on('error', reject);
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/localServer.test.ts
```

Expected: PASS — 2 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/localServer.ts ts/src/__tests__/localServer.test.ts
git commit -m "feat(ts): add Express local dev server"
```

---

## Task 19: localCLI.ts

**Files:**
- Create: `ts/src/localCLI.ts`
- Create: `ts/src/__tests__/localCLI.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ts/src/__tests__/localCLI.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock readline before importing localCLI
const mockRl = new EventEmitter() as EventEmitter & {
  prompt: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};
mockRl.prompt = vi.fn();
mockRl.close = vi.fn();

vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => mockRl),
  },
}));

import { localCLI } from '../localCLI.js';
import { APIInterface } from '../API.js';
import { ResponseJSON } from '../response.js';

const makeAPI = () =>
  new APIInterface({
    hello: { method: 'get', action: async () => new ResponseJSON({ hi: true }) },
  });

afterEach(() => {
  vi.clearAllMocks();
  mockRl.removeAllListeners();
});

describe('localCLI', () => {
  it('calls rl.prompt on start', () => {
    const api = makeAPI();
    void localCLI(api);
    expect(mockRl.prompt).toHaveBeenCalled();
  });

  it('resolves promise when readline closes', async () => {
    const api = makeAPI();
    const done = localCLI(api);
    mockRl.emit('close');
    await expect(done).resolves.toBeUndefined();
  });

  it('ignores empty lines', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const api = makeAPI();
    void localCLI(api);
    mockRl.emit('line', '   ');
    await new Promise(r => setTimeout(r, 10));
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it('closes on exit command', () => {
    const api = makeAPI();
    void localCLI(api);
    mockRl.emit('line', 'exit');
    expect(mockRl.close).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ts && npx vitest run src/__tests__/localCLI.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ts/src/localCLI.ts`**

```typescript
import readline from 'readline';
import { ConsoleHandler } from './handlers/console.js';
import type { APIInterface } from './API.js';

export const localCLI = (target: APIInterface): Promise<void> => {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    rl.prompt();

    rl.on('line', async (line: string) => {
      line = line.trim();
      if (!line) {
        rl.prompt();
        return;
      }
      if (line === 'exit' || line === 'quit') {
        rl.close();
        return;
      }
      try {
        const { path, params, body } = ConsoleHandler.parse(line);
        const method = await target.resolveMethod(path);
        const handler = new ConsoleHandler(path, params, method, body);
        const response = await target.execute([...path], params, method, body, handler.headers);
        handler.processResponse(response);
      } catch (err) {
        process.stderr.write(`Error: ${(err as Error).message}\n`);
      }
      rl.prompt();
    });

    rl.on('close', resolve);
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ts && npx vitest run src/__tests__/localCLI.test.ts
```

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add ts/src/localCLI.ts ts/src/__tests__/localCLI.test.ts
git commit -m "feat(ts): add interactive CLI entry point"
```

---

## Task 20: local.ts and exports.ts

**Files:**
- Create: `ts/src/local.ts`
- Create: `ts/src/exports.ts`

No unit tests for these — `local.ts` is the dev entry point and `exports.ts` is a re-export surface. Correctness is validated by the final build check.

- [ ] **Step 1: Create `ts/src/local.ts`**

```typescript
import { APIInterface } from './API.js';
import { LambdaSimulatorAPI } from './LambdaSimulatorAPI.js';
import { localServer } from './localServer.js';
import { ResponseJSON } from './response.js';
import { localCLI } from './localCLI.js';

class API extends APIInterface {
  constructor() {
    super({
      v1: {
        api: true,
        toplevel: true,
        tag: 'V1',
        action: () => Promise.resolve(new V1()),
      },
    });

    this.addLambdaSimulator(async () => new LambdaSimulatorAPI(this));
  }
}

class V1 extends APIInterface {
  constructor() {
    super({
      foo: {
        method: 'get',
        description: 'API to control data sources (e.g. Google Sheets, S3) and retrieve data from them',
        action: async () => new ResponseJSON({ message: 'Hello World!' }),
      },
    });
  }
}

console.log('starting local server...');
const api = new API();
const server = await localServer(api);
await localCLI(api);
```

- [ ] **Step 2: Create `ts/src/exports.ts`**

```typescript
export { APIInterface } from './API.js';
export type { Schema, SchemaNode, ParamDefinition, ActionResult } from './API.js';
export { handleLambdaTrigger } from './lambdaHandler.js';
export { localServer } from './localServer.js';
export { localCLI } from './localCLI.js';
export {
  ResponseJSON,
  ResponseText,
  ResponseHTML,
  ResponseXML,
  ResponseCSV,
  ResponseJSON2CSV,
} from './response.js';
export {
  BaseError,
  NotFoundError,
  MissingValueError,
  AuthError,
  SystemError,
  NotAllowedError,
  BadFormatError,
  NotImplementedError,
} from './errors.js';
```

- [ ] **Step 3: Commit**

```bash
git add ts/src/local.ts ts/src/exports.ts
git commit -m "feat(ts): add dev entry point and library export surface"
```

---

## Task 21: Full build verification

**Files:** No new files — validates all existing work compiles cleanly.

- [ ] **Step 1: Run the full test suite**

```bash
cd ts && npx vitest run
```

Expected: All test files pass, 0 failures.

- [ ] **Step 2: Run the TypeScript compiler**

```bash
cd ts && npm run build
```

Expected: `dist/` directory populated with `.js`, `.d.ts`, `.d.ts.map`, and `.js.map` files. Zero TypeScript errors.

- [ ] **Step 3: Spot-check dist output**

```bash
ls ts/dist/
ls ts/dist/handlers/
ls ts/dist/aws/
ls ts/dist/notifications/
```

Expected: Each `.ts` source has a corresponding `.js` and `.d.ts` in `dist/`.

- [ ] **Step 4: Verify the example entry point starts**

```bash
cd ts && timeout 3 node dist/local.js || true
```

Expected: `starting local server...` and `Express server running on http://localhost:5173/` printed before timeout.

- [ ] **Step 5: Final commit**

```bash
git add ts/
git commit -m "feat(ts): complete TypeScript port — all tests pass, tsc clean"
```
