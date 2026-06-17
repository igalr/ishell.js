# redleaf-ishell

A Node.js library for building REST APIs that run unchanged across multiple runtimes: a local Express HTTP server, an interactive readline CLI, and AWS Lambda (Function URLs, Kinesis, S3, SNS, Amazon Connect). You define one `APIInterface` tree; the library normalises every incoming event into a common format and routes it through the same execution path regardless of where it arrives.

---

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
3. [Defining a Schema](#defining-a-schema)
4. [Nested APIs (Sub-trees)](#nested-apis-sub-trees)
5. [Path Parameters](#path-parameters)
6. [Response Types](#response-types)
7. [Error Handling](#error-handling)
8. [Running Locally](#running-locally)
9. [CLI Mode](#cli-mode)
10. [Deploying to AWS Lambda](#deploying-to-aws-lambda)
11. [Lambda Simulator](#lambda-simulator)
12. [OpenAPI / Swagger Docs](#openapi--swagger-docs)
13. [API Key Authentication](#api-key-authentication)
14. [Access Control (ALLOW_API / DENY_API)](#access-control)
15. [Notifications](#notifications)
16. [Environment Variables](#environment-variables)
17. [Full API Reference](#full-api-reference)

---

## Installation

```bash
npm install redleaf-ishell
```

The package ships dual CJS and ESM builds. It works with Node.js 18+ and runs in both local development and AWS Lambda environments.

---

## Core Concepts

### The APIInterface tree

Every endpoint lives inside an `APIInterface`. An `APIInterface` holds a **schema** — a plain object whose keys are URL path segments and whose values are **schema nodes**. When a request arrives the library walks the path array left-to-right, calling each node's `action` in turn. If `action` returns another `APIInterface` the walk continues into that sub-tree; if it returns a `Response` the walk stops and that response is sent back to the caller.

```
request: GET /v1/foo
  └─ root schema["v1"].action()  →  returns V1 (an APIInterface)
       └─ V1 schema["foo"].action()  →  returns ResponseJSON({ message: "Hello World!" })
```

This design means your routing is plain TypeScript — no decorator magic, no framework configuration files.

### Schema node

```ts
interface SchemaNode {
  method?: string;           // HTTP verb: 'get' | 'post' | 'put' | 'patch' | 'delete'
  summary?: string;          // Short label shown in Swagger UI
  description?: string;      // Long description shown in Swagger UI
  tag?: string;              // Swagger tag (groups endpoints in the UI)
  api?: boolean;             // true = this node points to a sub-APIInterface
  toplevel?: boolean;        // true = top-level group, subject to ALLOW_API/DENY_API filtering
  params?: Record<string, ParamDefinition>; // query, path, or header params
  body?: object;             // JSON Schema for the request body (Swagger only)
  responses?: Record<string, { description: string }>; // documented response codes
  action: (
    params: Record<string, unknown>,
    body: unknown,
    headers: Record<string, string>
  ) => Promise<Response | APIInterface>;
}
```

---

## Defining a Schema

Create a class that extends `APIInterface` and pass a schema object to `super()`.

```ts
import {
  APIInterface,
  ResponseJSON,
  ResponseText,
  NotFoundError,
} from 'redleaf-ishell';

class MyAPI extends APIInterface {
  constructor() {
    super(
      {
        // GET /status
        status: {
          method: 'get',
          description: 'Health-check endpoint',
          action: async () => new ResponseJSON({ status: 'ok' }),
        },

        // POST /echo
        echo: {
          method: 'post',
          description: 'Echoes the request body back',
          body: { properties: { message: { type: 'string' } } },
          action: async (_params, body) => new ResponseJSON({ echo: body }),
        },

        // GET /greet?name=Alice
        greet: {
          method: 'get',
          description: 'Returns a greeting',
          params: {
            name: {
              in: 'query',
              type: 'string',
              required: true,
              description: 'Name to greet',
            },
          },
          action: async (params) => {
            const name = params['name'] as string;
            if (!name) throw new NotFoundError('name param is required');
            return new ResponseText(`Hello, ${name}!`);
          },
        },
      },
      'My API',   // title (appears in OpenAPI docs)
      '1.0.0'     // version
    );
  }
}
```

### The `action` signature

```ts
action: (
  params:  Record<string, unknown>,  // query string + path params
  body:    unknown,                  // parsed request body (JSON or raw)
  headers: Record<string, string>    // request headers + '_handler_type'
) => Promise<Response | APIInterface>
```

Every `action` must return a `Promise`. Return a `Response` subclass to end the request; return an `APIInterface` to continue routing into a sub-tree.

---

## Nested APIs (Sub-trees)

Mark a schema node with `api: true` to signal that its `action` returns an `APIInterface`. Add `toplevel: true` to make it a top-level group that appears as a separate section in the Swagger UI and that is subject to `ALLOW_API`/`DENY_API` filtering.

```ts
class RootAPI extends APIInterface {
  constructor() {
    super({
      v1: {
        api: true,
        toplevel: true,
        tag: 'V1',
        description: 'Version 1 endpoints',
        action: () => Promise.resolve(new V1API()),
      },
      v2: {
        api: true,
        toplevel: true,
        tag: 'V2',
        description: 'Version 2 endpoints',
        action: () => Promise.resolve(new V2API()),
      },
    });
  }
}

class V1API extends APIInterface {
  constructor() {
    super({
      items: {
        method: 'get',
        action: async () => new ResponseJSON([{ id: 1, name: 'Widget' }]),
      },
    });
  }
}
```

Requests to `GET /v1/items` will first call the `v1` node's action (getting a `V1API` back), then call `V1API`'s `items` action.

---

## Path Parameters

Declare a param with `in: 'path'` to consume the next URL segment as that parameter's value.

```ts
class ItemsAPI extends APIInterface {
  constructor() {
    super({
      item: {
        api: true,
        params: {
          id: { in: 'path', type: 'string', required: true, description: 'Item ID' },
        },
        action: (_params) => Promise.resolve(new ItemDetailAPI()),
      },
    });
  }
}

class ItemDetailAPI extends APIInterface {
  constructor() {
    super({
      get: {
        method: 'get',
        action: async (params) => {
          const id = params['id'];   // populated from the URL segment
          return new ResponseJSON({ id, name: 'Widget' });
        },
      },
    });
  }
}
```

URL: `GET /item/42/get` — `params.id` will be `"42"`.

---

## Response Types

All `action` functions must return one of the following concrete response classes. Import them from `redleaf-ishell`.

| Class | Content-Type | Constructor argument |
|---|---|---|
| `ResponseJSON` | `application/json` | Any serialisable value |
| `ResponseText` | `text/plain` | `string` |
| `ResponseHTML` | `text/html` | `string` |
| `ResponseXML` | `text/xml` | `string` |
| `ResponseCSV` | `text/csv` | `string` (pre-formatted CSV) |
| `ResponseJSON2CSV` | `text/csv` | `unknown[]` (array of objects — auto-converted) |

### Setting a non-200 status code

Call `.errorCode(n)` on any response object:

```ts
action: async () =>
  new ResponseJSON({ error: 'not ready' }).errorCode(503),
```

### ResponseJSON2CSV — automatic JSON-to-CSV conversion

```ts
action: async () =>
  new ResponseJSON2CSV([
    { id: 1, name: 'Alice', score: 95 },
    { id: 2, name: 'Bob',   score: 88 },
  ]),
```

The first row of the CSV is derived from the keys of the first object. String values containing commas or double-quotes are automatically quoted and escaped.

---

## Error Handling

### Design principle: return a valid Response or throw — nothing else

Every `action` function has exactly two allowed outcomes: it returns a `Response` subclass, or it throws a `BaseError` subclass. Returning `null`, `undefined`, a status flag, or a manually-constructed error payload is never correct. This contract keeps action signatures clean and shifts all HTTP error translation to the framework.

**Why this matters.** When error handling is the caller's problem, every action leaks control-flow noise:

```ts
// bad — manual error plumbing pollutes the action
action: async (params) => {
  const item = await db.find(params['id']);
  if (!item) {
    return new ResponseJSON({ error: 'not found' }).errorCode(404);
  }
  if (!item.active) {
    return new ResponseJSON({ error: 'not allowed' }).errorCode(403);
  }
  return new ResponseJSON(item);
},
```

With typed errors the action expresses only its happy path; the framework handles the rest:

```ts
// good — throw the right error class and move on
action: async (params) => {
  const item = await db.find(params['id']);
  if (!item)        throw new NotFoundError(`item ${params['id']} not found`);
  if (!item.active) throw new NotAllowedError('item is inactive');
  return new ResponseJSON(item);
},
```

The framework catches every `BaseError` thrown anywhere in the call stack, calls its `toJSON()` method, and returns an HTTP response with the correct status code and a structured JSON body — automatically, with no wiring required in the action itself.

### Built-in error classes

```ts
import {
  NotFoundError,
  AuthError,
  MissingValueError,
  SystemError,
  NotAllowedError,
  BadFormatError,
  NotImplementedError,
  AccessDeniedError,
} from 'redleaf-ishell';
```

| Class | Default message | HTTP status |
|---|---|---|
| `NotFoundError` | "Not Found" | 404 |
| `AuthError` | "Unauthorized" | 401 |
| `NotAllowedError` | "Not Allowed" | 403 |
| `AccessDeniedError` | "Access Denied" | 403 |
| `BadFormatError` | "Bad format" | 400 |
| `SystemError` | "System Error" | 500 |
| `MissingValueError` | "Value is missing" | 501 |
| `NotImplementedError` | "Not Implemented" | 501 |

Every constructor accepts an optional custom message as its first argument:

```ts
throw new NotFoundError('user 42 not found');
throw new BadFormatError('email must be a valid address');
throw new AuthError();   // uses the default message
```

### Custom error classes

Extend `BaseError` directly to add domain-specific error types with their own HTTP status codes:

```ts
import { BaseError } from 'redleaf-ishell';

class RateLimitError extends BaseError {
  constructor(message = 'Too Many Requests') {
    super('RateLimitError', message, 429);
  }
}

// use it exactly like any built-in error
throw new RateLimitError('slow down — max 100 requests per minute');
```

The framework treats custom `BaseError` subclasses identically to built-in ones: the status code you pass to `super()` becomes the HTTP status code of the response.

### Error response shape

All errors are serialised to JSON using `BaseError.toJSON()`:

```json
{
  "type": "NotFoundError",
  "message": "item 42 not found",
  "code": 404,
  "stack": ["at ItemsAPI.action (...)"]
}
```

Pass `?stacktrace=false` as a query parameter to suppress the stack trace in Lambda responses.

---

## Running Locally

```ts
import { APIInterface, localServer, localCLI } from 'redleaf-ishell';

const api = new MyAPI();
const server = await localServer(api);   // starts Express on PORT (default 3001)
await localCLI(api);                     // starts readline CLI on stdin
```

`localServer` starts an Express HTTP server on `PORT` (default `3001`). It:

- Accepts GET, POST, PUT, PATCH, and DELETE requests on all paths.
- Strips trailing slashes and file extensions from paths before routing.
- Serves the bundled Swagger UI at `/docs`.
- Logs the Swagger URL for each top-level API group on startup.
- Handles CORS automatically.
- Returns structured JSON error bodies for all thrown `BaseError` subclasses.

`localCLI` attaches an interactive readline prompt to `stdin`. Type `exit` or `quit` (or send EOF) to stop it.

Both `localServer` and `localCLI` target the same `APIInterface` instance, so local development requires no separate wiring.

### Typical entry point (`local.ts`)

```ts
import { APIInterface, LambdaSimulatorAPI, localServer, localCLI } from 'redleaf-ishell';

const api = new MyAPI();
api.addLambdaSimulator(async () => new LambdaSimulatorAPI(api));

const server = await localServer(api);
await localCLI(api);
```

Run with:

```bash
node dist/local.js
# or in watch mode:
nodemon --exec node dist/local.js
```

---

## CLI Mode

Once `localCLI` is running, type commands at the `>` prompt using the following syntax:

```
<path segments...> [--key value ...] ['<json-body>']
```

Examples:

```
> v1 status
> v1 greet --name Alice
> v1 echo '{"message":"hi"}'
> v1 items --limit 10 '{"filter":"active"}'
```

- Path segments are space-separated words before the first `--` flag.
- `--key value` pairs populate the `params` object.
- A bare token (optionally single- or double-quoted) after the flags is parsed as JSON; if it is not valid JSON it is passed as a raw string.
- Type `exit` or `quit` to stop the CLI.

The CLI automatically resolves the HTTP method by walking the schema tree, so you do not need to specify it manually.

---

## Deploying to AWS Lambda

```ts
import { handleLambdaTrigger } from 'redleaf-ishell';

const api = new MyAPI();

export const handler = async (event: unknown) => {
  return handleLambdaTrigger(event, api);
};
```

`handleLambdaTrigger` automatically detects the event source and routes accordingly. It handles:

| Event source | Handler class | Detection |
|---|---|---|
| Lambda Function URL | `LambdaURLHandler` | `event.requestContext.http.method` present |
| Express (local forwarding) | `ExpressURLHandler` | `event.method` + `event.requestContext.http` present |
| Amazon Connect Contact Flow | `AmazonConnectHandler` | `event.Name === 'ContactFlowEvent'` |
| Kinesis | `KinesistHandler` | `event.Records[0].eventSource === 'aws:kinesis'` |
| S3 | `S3Handler` | `event.Records[0].eventSource === 'aws:s3'` |
| SNS | `SNSHandler` | `event.Records[0].EventSource === 'aws:sns'` |

Detection is tried in the order above; the first match wins.

### Lambda Function URL events

The handler normalises the Lambda Function URL payload into `path`, `params` (query string), `method`, `payload` (parsed body), and `headers`. It then calls `target.execute(...)` and formats the result as a Lambda response object:

```json
{
  "statusCode": 200,
  "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  "body": "{\"message\":\"Hello World!\"}"
}
```

CORS pre-flight (`OPTIONS`) requests are handled automatically with the correct `Access-Control-Allow-*` headers.

### Event-driven handlers (Kinesis, S3, SNS)

These handlers expose the event through special path identifiers. Register a dedicated schema node using `addHandler`:

```ts
import { APIInterface, KinesistHandler, S3Handler, SNSHandler, ResponseJSON } from 'redleaf-ishell';

class MyAPI extends APIInterface {
  constructor() {
    super({ /* your HTTP endpoints */ });

    this.addHandler(KinesistHandler.identifier, async (_params, body) => {
      // body is the raw Kinesis event
      console.log('Kinesis records:', body);
      return new ResponseJSON({ processed: true });
    });

    this.addHandler(S3Handler.identifier, async (_params, body) => {
      // body is an array of S3EventSummary: { eventName, bucket, key, size }
      const events = body as Array<{ bucket: string; key: string }>;
      return new ResponseJSON({ received: events.length });
    });

    this.addHandler(SNSHandler.identifier, async (_params, body) => {
      // body is an array of parsed SNS messages
      return new ResponseJSON({ ok: true });
    });
  }
}
```

`addHandler(key, fn)` registers a POST handler at the given key using a plain action function. The identifier constants are:

- `KinesistHandler.identifier` — `'__kinesis__'`
- `S3Handler.identifier`       — `'__s3__'`
- `SNSHandler.identifier`      — `'__sns__'`

### Amazon Connect

`AmazonConnectHandler` extracts `Details.Parameters` (or `ContactData.Attributes` as fallback) into `params`, and reads `params.path` as the routing path. The response must be a `ResponseJSON` whose content is a plain object; the handler appends `{ lambdaResult: "Success" }` to it before returning.

---

## Lambda Simulator

During local development you can POST a raw Lambda event to your local Express server to test event-driven handlers without deploying.

```ts
import { LambdaSimulatorAPI } from 'redleaf-ishell';

api.addLambdaSimulator(async () => new LambdaSimulatorAPI(api));
```

`addLambdaSimulator` registers a `lambda` top-level group (subject to `ALLOW_API`/`DENY_API`) that exposes a single endpoint:

```
POST /lambda/simulate
```

Send any raw Lambda event as the request body and the response will be the Lambda handler's return value. This lets you test Kinesis, S3, and SNS handlers through the same Express server.

---

## OpenAPI / Swagger Docs

The bundled Swagger UI is served automatically at `/docs` by both the Express server and the Lambda handler.

To view the interactive documentation for a specific top-level API group:

```
http://localhost:3001/docs/?root=v1
```

The `root` query parameter corresponds to the key in the root schema where the top-level group is registered (e.g. `v1`, `v2`).

### How documentation is generated

`OpenAPI` recursively walks the schema tree by calling `action()` on every node where `api: true`. It builds an OpenAPI 3.0 document from:

- `method` — HTTP verb for each leaf endpoint.
- `summary` / `description` — endpoint descriptions.
- `tag` — groups endpoints under a named section.
- `params` — rendered as OpenAPI `parameters` (query, path, or header).
- `body` — rendered as a `requestBody` with `application/json` content.
- `responses` — documented response codes; if a `401` response is declared, `ApiKeyAuth` security is automatically added to that endpoint.

### Documenting parameters

```ts
params: {
  userId: {
    in: 'query',     // 'query' | 'path' | 'header'
    type: 'string',  // OpenAPI primitive type
    required: true,
    default: undefined,
    description: 'The user identifier',
  },
}
```

### Documenting request bodies

```ts
body: {
  properties: {
    name:  { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['name', 'email'],
}
```

### Documenting response codes

```ts
responses: {
  '200': { description: 'User object' },
  '401': { description: 'Unauthorized' },
  '404': { description: 'User not found' },
}
```

Declaring a `401` response automatically adds `security: [{ ApiKeyAuth: [] }]` to the OpenAPI path entry.

---

## API Key Authentication

`APIInterface` provides a helper method for validating `x-api-key` headers:

```ts
class SecureAPI extends APIInterface {
  #apiKey = process.env.MY_API_KEY;

  constructor() {
    super({
      secret: {
        method: 'get',
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
        action: async (_params, _body, headers) => {
          this.confirmAPIKey(headers, this.#apiKey);
          return new ResponseJSON({ data: 'sensitive' });
        },
      },
    });
  }
}
```

`confirmAPIKey(headers, apiKey)` reads `headers['x-api-key']` and throws an `AuthError` (HTTP 401) if it is absent or does not match. Pass `undefined` as the second argument to skip validation (useful when the key is not configured).

---

## Access Control

### ALLOW_API

Comma-separated list of top-level schema keys to expose. The default is `all`, which exposes every key where `toplevel: true`.

```bash
ALLOW_API=v1,v2   # expose only v1 and v2
ALLOW_API=all     # expose everything (default)
```

### DENY_API

Comma-separated list of top-level keys to block. If the first entry is `all`, the entire schema is emptied.

```bash
DENY_API=lambda     # hide the Lambda simulator
DENY_API=all        # block all top-level groups
```

Filtering happens in the `APIInterface` constructor. Only nodes where both `api: true` and `toplevel: true` are set are subject to filtering.

---

## Notifications

### SNSPublisher

Publishes JSON messages to an AWS SNS topic.

```ts
import { SNSPublisher } from 'redleaf-ishell';

// The full topic ARN can be assembled from two parts:
// process.env.SNS_ARN_PREFIX + topicSuffix
const publisher = new SNSPublisher('my-topic-suffix');

await publisher.publish({ event: 'order.placed', orderId: 42 });
```

When running inside a Lambda function (`AWS_LAMBDA_FUNCTION_NAME` is set) the publisher uses the Lambda execution role for credentials. When running locally it loads credentials from the AWS profile specified in `AWS_PROFILE`.

**Required environment variables:**

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region for the SNS client |
| `SNS_ARN_PREFIX` | Prefix prepended to the constructor's topic argument to form the full ARN (e.g. `arn:aws:sns:us-east-1:123456789012:`) |
| `AWS_PROFILE` | (local only) Named AWS credentials profile |

### NotificationChannel

Posts a webhook notification to any HTTP endpoint (e.g. Google Chat, Slack incoming webhooks).

```ts
import { NotificationChannel } from 'redleaf-ishell';

const channel = new NotificationChannel(process.env.WEBHOOK_URL);

await channel.notify({ text: 'Deployment complete' });

// Post to a specific thread
await channel.notify('New order received', 'order-thread-key');
```

The message is serialised with `JSON.stringify` before sending. Errors are caught and logged; the method always resolves (it never throws).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port for the local Express server |
| `ALLOW_API` | `all` | Comma-separated top-level API keys to expose |
| `DENY_API` | _(none)_ | Comma-separated top-level API keys to block; `all` blocks everything |
| `AWS_LOG_IO` | _(unset)_ | Set to `true` to log the full Lambda input JSON; otherwise logs a 100-character summary |
| `AWS_LAMBDA_FUNCTION_NAME` | _(unset)_ | Set automatically by Lambda; appended to the API title in docs; also controls `SNSPublisher` credential strategy |
| `AWS_REGION` | _(unset)_ | AWS region used by `SNSPublisher` |
| `SNS_ARN_PREFIX` | `""` | Prefix prepended to the `SNSPublisher` topic argument |
| `AWS_PROFILE` | _(unset)_ | AWS credentials profile used by `SNSPublisher` when running locally |

---

## Full API Reference

### `APIInterface`

```ts
class APIInterface {
  constructor(schema?: Schema, title?: string, version?: string)

  // Walk path and execute. Returns a Response.
  execute(
    path: string | string[],
    params: Record<string, unknown>,
    methods: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<Response>

  // Walk schema to resolve the declared HTTP method for a path.
  resolveMethod(path: string | string[]): Promise<string>

  // Register a POST handler for a special path key (e.g. event-source identifiers).
  addHandler(key: string, handler: SchemaNode['action']): void

  // Register the Lambda simulator sub-API (gated by ALLOW_API/DENY_API).
  addLambdaSimulator(simulator: () => Promise<APIInterface>): void

  // Throw AuthError if x-api-key header does not match apiKey.
  confirmAPIKey(headers: Record<string, string>, apiKey: string | undefined): void

  // Read-only view of the current schema (after ALLOW_API/DENY_API filtering).
  get schema(): Schema
}
```

### `handleLambdaTrigger`

```ts
handleLambdaTrigger(input: unknown, target: APIInterface): Promise<unknown>
```

Top-level Lambda handler. Detects the event source, normalises the event, calls `target.execute(...)`, and returns a Lambda-formatted response.

### `localServer`

```ts
localServer(target: APIInterface): Promise<http.Server>
```

Starts an Express server on `PORT`. Returns the `http.Server` instance.

### `localCLI`

```ts
localCLI(target: APIInterface): Promise<void>
```

Starts a readline prompt on `stdin`. Resolves when the user types `exit`/`quit` or closes stdin.

### `LambdaSimulatorAPI`

```ts
class LambdaSimulatorAPI extends APIInterface {
  constructor(api: APIInterface, version?: string)
}
```

An `APIInterface` with a single `POST /simulate` endpoint. Pass the raw Lambda event as the request body; the response is the Lambda handler's return value.

### Response classes

```ts
class ResponseJSON    extends Response { constructor(data: unknown) }
class ResponseText    extends Response { constructor(data: string) }
class ResponseHTML    extends Response { constructor(data: string) }
class ResponseXML     extends Response { constructor(data: string) }
class ResponseCSV     extends Response { constructor(data: string) }
class ResponseJSON2CSV extends Response {
  constructor(data: unknown[])
  static json2CSV(list: unknown[]): string
}

// Common to all:
response.errorCode(code: number): this   // set a non-200 HTTP status
response.content: unknown                // the response body
response.contentType: string             // MIME type
response.returnCode: number              // HTTP status code
```

### Error classes

```ts
class BaseError           extends Error { constructor(name, message, statusCode) }
class NotFoundError       extends BaseError  // 404
class AuthError           extends BaseError  // 401
class NotAllowedError     extends BaseError  // 403
class AccessDeniedError   extends BaseError  // 403 (includes AWS command context in toJSON())
class BadFormatError      extends BaseError  // 400
class SystemError         extends BaseError  // 500
class MissingValueError   extends BaseError  // 501
class NotImplementedError extends BaseError  // 501
```

### `SNSPublisher`

```ts
class SNSPublisher {
  constructor(topic?: string | null)       // topic appended to SNS_ARN_PREFIX
  publish(message: unknown): Promise<unknown>
  get topic(): string
}
```

### `NotificationChannel`

```ts
class NotificationChannel {
  constructor(notificationUrl?: string | null)
  notify(message: unknown, threadkey?: string | null): Promise<unknown>
  get url(): string | null
}
```

### TypeScript types

```ts
interface ParamDefinition {
  in?: 'query' | 'path' | 'header';
  type?: string;
  required?: boolean;
  default?: unknown;
  description?: string;
}

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
type ActionResult = Promise<Response | APIInterface>;
```

---

## Complete Minimal Example

```ts
// src/local.ts
import {
  APIInterface,
  LambdaSimulatorAPI,
  localServer,
  localCLI,
  ResponseJSON,
  ResponseText,
  NotFoundError,
  MissingValueError,
} from 'redleaf-ishell';

class RootAPI extends APIInterface {
  constructor() {
    super(
      {
        v1: {
          api: true,
          toplevel: true,
          tag: 'V1',
          description: 'Version 1',
          action: () => Promise.resolve(new V1()),
        },
      },
      'My Service',
      '1.0.0'
    );
    this.addLambdaSimulator(async () => new LambdaSimulatorAPI(this));
  }
}

class V1 extends APIInterface {
  constructor() {
    super({
      hello: {
        method: 'get',
        description: 'Say hello',
        params: {
          name: { in: 'query', type: 'string', required: false },
        },
        action: async (params) => {
          const name = (params['name'] as string) || 'World';
          return new ResponseText(`Hello, ${name}!`);
        },
      },
      items: {
        method: 'post',
        description: 'Create an item',
        body: { properties: { title: { type: 'string' } }, required: ['title'] },
        action: async (_params, body) => {
          const { title } = body as { title?: string };
          if (!title) throw new MissingValueError('title is required');
          return new ResponseJSON({ id: Date.now(), title });
        },
      },
    });
  }
}

const api = new RootAPI();
await localServer(api);
await localCLI(api);
```

```ts
// src/lambda.ts  (Lambda entry point)
import { handleLambdaTrigger } from 'redleaf-ishell';
import { RootAPI } from './myAPI.js';

const api = new RootAPI();
export const handler = (event: unknown) => handleLambdaTrigger(event, api);
```
