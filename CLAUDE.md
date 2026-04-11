# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`redleaf-ishell` is a Node.js library for building REST APIs that run both locally (Express + interactive CLI) and as AWS Lambda functions. The same `APIInterface` tree serves all runtimes — the library normalizes each event source into a common format and routes it through the same execution path.

The repo contains two parallel implementations:
- **`js/`** — plain JavaScript (ES modules), published with obfuscation
- **`ts/`** — TypeScript, published via tsup (minified CJS + ESM)

## Repository Layout

```
js/
  src/
    API.js               # Core APIInterface class
    lambdaHandler.js     # Lambda entry point — dispatches to handlers
    localServer.js       # Express wrapper for local dev
    localCLI.js          # Interactive readline CLI for local dev
    local.js             # Example entry point (shows usage pattern)
    LambdaSimulatorAPI.js# Sub-API that lets you POST a raw Lambda event locally
    OpenAPI.js           # Auto-generates OpenAPI 3.0 JSON from schema tree
    response.js          # Response types (ResponseJSON, ResponseText, etc.)
    errors.js            # Typed error hierarchy (BaseError → NotFoundError, AuthError, …)
    exports.js           # CommonJS re-export surface for library consumers
    handlers/            # One class per AWS event source
    aws/                 # AWS-specific helpers (Kinesis)
    notifications/       # NotificationChannel, SNSPublisher
  swagger/               # Bundled Swagger UI — served at /docs
  obfuscator.config.cjs  # javascript-obfuscator config for build

ts/
  src/
    API.ts               # Core APIInterface class (typed)
    lambdaHandler.ts
    localServer.ts
    localCLI.ts
    local.ts
    LambdaSimulatorAPI.ts
    OpenAPI.ts
    response.ts
    errors.ts
    exports.ts
    handlers/            # One class per AWS event source
    aws/
    notifications/
  swagger/               # Bundled Swagger UI — served at /docs
  tsconfig.json          # ES2022, NodeNext modules
  tsup.config.ts         # Dual CJS+ESM build with minification
```

## Development Commands

### JavaScript (`js/`)

```bash
cd js
npm install
npm run dev     # nodemon, hot-reload on src/local.js  (PORT=5173)
npm start       # node src/local.js  (PORT=5173)
npm test        # vitest run
npm run build   # obfuscate src/ → dist/, copy swagger/
npm run publish # build + strip dev fields from package.json + npm publish dist/
```

### TypeScript (`ts/`)

```bash
cd ts
npm install
npm run dev     # nodemon on dist/local.js  (requires a prior build)
npm start       # node dist/local.js
npm test        # vitest run
npm run build   # tsc → dist/  (unminified, for local dev/testing)
npm run hide    # tsup → dist/ with minification + copy swagger/ (for publishing)
npm run publish # hide + strip dev fields from package.json + npm publish dist/
```

`pre-publish.js` (both projects): writes a clean `dist/package.json` with `scripts` and `devDependencies` removed before publishing.

## Core Architecture

### APIInterface (API.js / API.ts)

The API is a tree of schema nodes. Each node has:
- `action(params, body, headers)` — returns either a `Response` object (leaf) or another `APIInterface` (sub-tree, enabling nested routing)
- `method` — HTTP verb declared on the node
- `api: true, toplevel: true` — marks a node as a top-level API group; controls visibility in docs and is filtered by `ALLOW_API`/`DENY_API` env vars

`execute()` walks the path array, calling each node's `action` in turn. If an action returns an `APIInterface`, traversal continues into its schema.

### Input Handlers (handlers/)

`lambdaHandler.js/.ts` calls `handlers.matchHandler(input)` which tries each handler's static `isXxx(input)` detector in order:

1. `LambdaURLHandler` — Lambda Function URL events (`requestContext.http`)
2. `ExpressURLHandler` — requests forwarded from the local Express server
3. `AmazonConnectHandler`, `KinesisHandler`, `S3Handler`, `SNSHandler`

Each handler normalizes the raw event into `.path`, `.params`, `.method`, `.payload`, `.headers`, and implements `processResponse()` to format the reply for that runtime.

### Response Types (response.js / response.ts)

All actions must return one of: `ResponseJSON`, `ResponseText`, `ResponseHTML`, `ResponseXML`, `ResponseCSV`, `ResponseJSON2CSV`. Call `.errorCode(n)` to set a non-200 status.

### Local Dev Modes

- **Express** (`localServer`): mounts all HTTP verbs, strips file extensions from paths, serves Swagger UI at `/docs`.
- **CLI** (`localCLI`): readline loop; input format is `seg1 seg2 --key value '<json-body>'`. Uses `ConsoleHandler`.

### OpenAPI Docs

`OpenAPI.js/.ts` walks the schema tree recursively (calling `action()` on `api: true` nodes) to build an OpenAPI 3.0 document. Served at `/docs/?root=<topLevelKey>` by both the local server and the Lambda handler.

## Build Differences

| | JS | TS |
|---|---|---|
| Source | `src/*.js` (ES modules) | `src/*.ts` |
| Build tool | `javascript-obfuscator` | `tsc` (dev) / `tsup` (publish) |
| Output formats | ESM only | CJS + ESM (tsup) |
| Type declarations | none | none (dts disabled) |
| Tests | vitest | vitest |

## Key Environment Variables

| Variable | Effect |
|---|---|
| `PORT` | Local server port (default 3001) |
| `ALLOW_API` | Comma-separated list of top-level keys to expose; `all` (default) exposes everything |
| `DENY_API` | Comma-separated list to block; `all` blocks everything |
| `AWS_LOG_IO=true` | Log full Lambda input JSON (otherwise logs a truncated summary) |
| `AWS_LAMBDA_FUNCTION_NAME` | When set, appended to the API title in docs |

## Adding a New Endpoint

Follow the pattern in `src/local.js` (or `src/local.ts`):
1. Add a node to a schema object with `method`, `description`, and `action`.
2. `action` receives `(params, body, headers)` and must return a `Response` subclass.
3. For nested APIs, return `new SomeAPIInterface()` from `action` and mark the node `api: true`.
4. Throw a `BaseError` subclass (e.g. `NotFoundError`, `AuthError`) for structured error responses.
