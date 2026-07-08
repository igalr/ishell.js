import { InputHandler } from "./inputHandler.js";
import type { Response } from "../response.js";

export class ConsoleHandler extends InputHandler {
  constructor(
    path: string[],
    params: Record<string, string | number | boolean>,
    method: string,
    body: any,
  ) {
    super("console");
    this._path = path;
    this._params = params;
    this._method = method;
    this._payload = body;
    this._headers = { _handler_type: "console" };
  }

  static parse(line: string): {
    path: string[];
    params: Record<string, string | number | boolean>;
    body: any;
  } {
    const tokens = ConsoleHandler.#tokenize(line.trim());
    const path: string[] = [];
    const params: Record<string, string | number | boolean> = {};
    let body: any = null;

    let i = 0;
    // Leading non-flag tokens are the path
    while (i < tokens.length && !tokens[i].startsWith("--")) {
      path.push(tokens[i]);
      i++;
    }

    // Parse --key value pairs; a non-flag token encountered mid-parse is the body
    while (i < tokens.length) {
      if (tokens[i].startsWith("--")) {
        const key = tokens[i].slice(2);
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith("--")) {
          const value = tokens[i + 1];
          if (!isNaN(Number(value))) {
            params[key] = Number(value);
          } else if (value === "true" || value === "false") {
            params[key] = value === "true";
          } else {
            params[key] = value;
          }
          i += 2;
        } else {
          params[key] = true;
          i++;
        }
      } else {
        // Non-flag token: remaining tokens form the body
        const raw = tokens.slice(i).join(" ");
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
    let current = "";
    let inSingle = false;
    let inDouble = false;

    for (const c of line) {
      if (c === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (c === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (c === " " && !inSingle && !inDouble) {
        if (current) {
          tokens.push(current);
          current = "";
        }
      } else {
        current += c;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  processResponse(response: Response): Response {
    const content = response.content;
    if (response.contentType?.startsWith("application/json")) {
      process.stdout.write(JSON.stringify(content, null, 2) + "\n");
    } else {
      process.stdout.write(String(content) + "\n");
    }
    return response;
  }
}
