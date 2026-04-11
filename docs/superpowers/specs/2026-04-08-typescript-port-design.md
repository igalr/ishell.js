# TypeScript Port of ishell.js — Design Spec

**Date:** 2026-04-08  
**Project:** `ishell.js` (`br-terminal` branch)  
**Scope:** Port `js/` source to strict, library-grade TypeScript in `ts/`

---

## Goal

Produce a `ts/` directory that is a standalone TypeScript implementation of the `js/` source. It compiles to JS via `tsc`, emits `.d.ts` declaration files for library consumers, and is fully independent of `js/` (no cross-directory imports).

---

## Directory Layout

```
ts/
  src/
    API.ts
    LambdaSimulatorAPI.ts
    OpenAPI.ts
    lambdaHandler.ts
    localServer.ts
    localCLI.ts
    local.ts
    response.ts
    errors.ts
    exports.ts
    handlers/
      inputHandler.ts
      handlers.ts
      express.ts
      lambdaURL.ts
      amazonConnect.ts
      KinesisHandler.ts
      S3Handler.ts
      SNSHandler.ts
      console.ts
    aws/
      Kinesis.ts
    notifications/
      NotificationChannel.ts
      SNSPublisher.ts
  dist/               ← tsc output, gitignored
  tsconfig.json
  package.json
  .gitignore
```

---

## Build Configuration

**`tsconfig.json`:**
- `target: "ES2022"` — native private class fields (`#field`) supported
- `module: "NodeNext"` + `moduleResolution: "NodeNext"` — proper ESM with `.js` import extensions
- `outDir: "./dist"`, `rootDir: "./src"`
- `strict: true` — full strict mode
- `declaration: true` — emit `.d.ts` files
- `declarationMap: true` — source maps for declarations
- `sourceMap: true` — runtime source maps

**`package.json` scripts:**
- `build` → `tsc`
- `dev` → `nodemon --exec node dist/local.js`
- `start` → `node dist/local.js`

**`.gitignore`:** `dist/`, `node_modules/`, `package-lock.json`

---

## Type System

### Core interfaces (`API.ts`)

```typescript
interface ParamDefinition {
  in?: 'query' | 'path' | 'header';
  type?: string;
  required?: boolean;
  default?: unknown;
  description?: string;
}

type ActionResult = Promise<Response | APIInterface>;

interface SchemaNode {
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

type Schema = Record<string, SchemaNode>;
```

`APIInterface` is typed as `APIInterface` holding a `Schema` internally. The `schema` getter returns `Schema` (readonly view used by `OpenAPI` and `localServer`).

### Response hierarchy (`response.ts`)

```typescript
abstract class Response {
  abstract readonly content: unknown;
  abstract readonly contentType: string;
  readonly returnCode: number;        // default 200
  errorCode(code: number): this;
}

class ResponseJSON extends Response { constructor(data: unknown) }
class ResponseText extends Response { constructor(data: string) }
class ResponseHTML extends Response { constructor(data: string) }
class ResponseXML  extends Response { constructor(data: string) }
class ResponseCSV  extends Response { constructor(data: string) }
class ResponseJSON2CSV extends Response { constructor(data: unknown[]) }
```

### Error hierarchy (`errors.ts`)

```typescript
abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly name: string;
}
// Concrete: NotFoundError(404), MissingValueError(501),
//           AuthError(401), SystemError(500),
//           NotAllowedError(403), BadFormatError(400),
//           NotImplementedError(501)
```

### InputHandler base (`handlers/inputHandler.ts`)

```typescript
abstract class InputHandler {
  readonly type: string;
  protected _path: string[];
  protected _method: string;
  protected _params: Record<string, unknown>;
  protected _payload: unknown;
  protected _format: string;
  protected _headers: Record<string, string>;

  get path(): string[]
  get method(): string
  get params(): Record<string, unknown>
  get payload(): unknown
  get format(): string
  get headers(): Record<string, string>

  processResponse(response: Response, headers?: Record<string, string>): unknown;
  shortInputLog(input: unknown): string;
}
```

Each handler subclass (`LambdaURLHandler`, `ExpressURLHandler`, `AmazonConnectHandler`, `KinesistHandler`, `S3Handler`, `SNSHandler`, `ConsoleHandler`) extends `InputHandler` and implements a static `isXxx(input: unknown): boolean` detector.

### AWS helpers

- `KinesisRecords` / `KinesisRecord` (`aws/Kinesis.ts`): typed wrappers over raw Kinesis event records. `KinesisRecord.data` returns `unknown` (parsed JSON).
- `SNSPublisher` (`notifications/SNSPublisher.ts`): uses `@aws-sdk/client-sns` types (`PublishCommand`, `SNSClient`). Requires `@aws-sdk/client-sns` and `@aws-sdk/credential-providers` as dependencies.
- `NotificationChannel` (`notifications/NotificationChannel.ts`): plain fetch-based webhook notifier.

---

## Module Boundaries

`exports.ts` is the library's public surface:

```typescript
export { APIInterface } from './API.js';
export { handleLambdaTrigger } from './lambdaHandler.js';
export { localServer } from './localServer.js';
export { localCLI } from './localCLI.js';
export { ResponseJSON, ResponseText, ResponseHTML, ResponseXML } from './response.js';
```

Note: under `NodeNext` module resolution, imports within `src/` use `.js` extensions (pointing at the compiled output), not `.ts`.

---

## Key Implementation Notes

1. **Private fields**: Keep JS `#field` syntax — supported in ES2022 target. No need to switch to TypeScript `private`.
2. **`local.ts`**: This is the example/dev entry point, not part of the library surface. It mirrors `js/local.mjs`.
3. **`SNSPublisher`**: Add `@aws-sdk/client-sns` and `@aws-sdk/credential-providers` to `ts/package.json` dependencies.
4. **`exports.ts`**: Uses `export { }` named re-exports (not `module.exports`) — proper ESM.
5. **Unreachable code in `S3Handler`**: The JS source has dead code after `return false`. Port faithfully; do not remove.
6. **`KinesistHandler` typo**: Preserve the existing typo (`Kinesis*t*Handler`) for consistency with the JS source.
