# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`ishell.js` is a Node.js library for building REST APIs that run both locally (Express + interactive CLI) and as AWS Lambda functions. The same `APIInterface` tree serves all runtimes — the library normalizes each event source into a common format and routes it through the same execution path.

## Repository Layout

All source lives under `js/`. The root-level files visible in older commits have been moved there. Work against `js/` exclusively.

```
js/
  API.mjs               # Core APIInterface class
  lambdaHandler.mjs     # Lambda entry point — dispatches to handlers
  localServer.mjs       # Express wrapper for local dev
  localCLI.mjs          # Interactive readline CLI for local dev
  local.mjs             # Example entry point (shows usage pattern)
  LambdaSimulatorAPI.mjs# Sub-API that lets you POST a raw Lambda event locally
  OpenAPI.mjs           # Auto-generates OpenAPI 3.0 JSON from schema tree
  response.mjs          # Response types (ResponseJSON, ResponseText, etc.)
  errors.mjs            # Typed error hierarchy (BaseError → NotFoundError, AuthError, …)
  exports.mjs           # CommonJS re-export surface for library consumers
  handlers/             # One class per AWS event source
  aws/                  # AWS-specific helpers (Kinesis)
  notifications/        # NotificationChannel, SNSPublisher
  swagger/              # Bundled Swagger UI — served at /docs
```

## Development Commands

All commands run from `js/`:

```bash
cd js
npm install
npm run dev     # nodemon + PORT=5173, hot-reload on src/local.mjs
npm start       # node src/local.mjs, PORT=5173
```

No test suite is configured (`npm test` fails by design).

## Core Architecture

### APIInterface (API.mjs)

The API is a tree of schema nodes. Each node has:
- `action(params, body, headers)` — returns either a `Response` object (leaf) or another `APIInterface` (sub-tree, enabling nested routing)
- `method` — HTTP verb declared on the node
- `api: true, toplevel: true` — marks a node as a top-level API group; controls visibility in docs and is filtered by `ALLOW_API`/`DENY_API` env vars

`execute()` walks the path array, calling each node's `action` in turn. If an action returns an `APIInterface`, traversal continues into its schema.

### Input Handlers (handlers/)

`lambdaHandler.mjs` calls `handlers.matchHandler(input)` which tries each handler's static `isXxx(input)` detector in order:

1. `LambdaURLHandler` — Lambda Function URL events (`requestContext.http`)
2. `ExpressURLHandler` — requests forwarded from the local Express server
3. `AmazonConnectHandler`, `KinesistHandler`, `S3Handler`, `SNSHandler`

Each handler normalizes the raw event into `.path`, `.params`, `.method`, `.payload`, `.headers`, and implements `processResponse()` to format the reply for that runtime.

### Response Types (response.mjs)

All actions must return one of: `ResponseJSON`, `ResponseText`, `ResponseHTML`, `ResponseXML`, `ResponseCSV`, `ResponseJSON2CSV`. Call `.errorCode(n)` to set a non-200 status.

### Local Dev Modes

- **Express** (`localServer`): mounts all HTTP verbs, strips file extensions from paths, serves Swagger UI at `/docs`.
- **CLI** (`localCLI`): readline loop; input format is `seg1 seg2 --key value '<json-body>'`. Uses `ConsoleHandler`.

### OpenAPI Docs

`OpenAPI.mjs` walks the schema tree recursively (calling `action()` on `api: true` nodes) to build an OpenAPI 3.0 document. Served at `/docs/?root=<topLevelKey>` by both the local server and the Lambda handler.

## Key Environment Variables

| Variable | Effect |
|---|---|
| `PORT` | Local server port (default 3001) |
| `ALLOW_API` | Comma-separated list of top-level keys to expose; `all` (default) exposes everything |
| `DENY_API` | Comma-separated list to block; `all` blocks everything |
| `AWS_LOG_IO=true` | Log full Lambda input JSON (otherwise logs a truncated summary) |
| `AWS_LAMBDA_FUNCTION_NAME` | When set, appended to the API title in docs |

## Adding a New Endpoint

Follow the pattern in `js/local.mjs`:
1. Add a node to a schema object with `method`, `description`, and `action`.
2. `action` receives `(params, body, headers)` and must return a `Response` subclass.
3. For nested APIs, return `new SomeAPIInterface()` from `action` and mark the node `api: true`.
4. Throw a `BaseError` subclass (e.g. `NotFoundError`, `AuthError`) for structured error responses.
