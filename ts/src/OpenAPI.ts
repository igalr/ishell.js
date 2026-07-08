import { APIInterface, type ParamDefinition } from "./API.js";

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
    path = "/",
    hparams: Record<string, ParamDefinition> = {},
  ) {
    this.#api = api;
    this.#path = path.startsWith("/") ? path : "/" + path;
    this.#hparams = hparams;
    this.#title = title || "API Documentation";
    this.#version = version || "1.0.0";
  }

  async json(): Promise<Record<string, unknown>> {
    const doc: Record<string, unknown> = {
      openapi: "3.0.0",
      info: { title: this.#title, version: this.#version },
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
        },
      },
    };
    doc["paths"] = await this.#generatePaths(
      this.#api,
      this.#path,
      this.#hparams,
    );
    doc["tags"] = await this.#generateTags(this.#api, this.#path);
    return doc;
  }

  async #generatePaths(
    node: APIInterface,
    root: string,
    hparams: Record<string, ParamDefinition>,
    tag: string | null = null,
  ): Promise<Record<string, unknown>> {
    let paths: Record<string, unknown> = {};
    const localHparams = { ...hparams };

    for (const [key, value] of Object.entries(node.schema)) {
      const rootNorm = root.endsWith("/") ? root.slice(0, -1) : root;
      let path = `${rootNorm}/${key}`;
      const method = value.method || "get";

      const params = [
        ...Object.entries(localHparams).map(([paramName, paramDetails]) => ({
          name: paramName,
          in: paramDetails.in || "path",
          required: paramDetails.required || false,
          schema: { type: paramDetails.type || "string" },
          description: paramDetails.description || "",
        })),
        ...Object.entries(value.params || {}).map(
          ([paramName, paramDetails]) => ({
            name: paramName,
            in: paramDetails.in || "query",
            required: paramDetails.required || false,
            default: paramDetails.default,
            schema: { type: paramDetails.type || "string" },
            description: paramDetails.description || "",
          }),
        ),
      ];

      const responses = value.responses || {
        "200": { description: "Successful response" },
      };
      let entry: Record<string, unknown> = {
        summary: value.summary || "",
        description: value.description || "",
        operationId: this.#slug(path),
        tags: tag ? [tag] : [],
        parameters: params,
        responses,
      };
      if (responses["401"] || responses[401]) {
        entry["security"] = [{ ApiKeyAuth: [] }];
      }
      if (value.body) {
        const body: any = value.body;
        const format: string = body.format || "application/json";
        entry["requestBody"] = {
          content: {
            [format]: { schema: body },
          },
        };
      }
      const methodEntry = { [method.toLowerCase()]: entry };

      if (value.api === true && typeof value.action === "function") {
        let prms: string[] | null = null;
        if (value.params) {
          prms = [];
          for (const [paramName, paramDetails] of Object.entries(
            value.params,
          )) {
            if (paramDetails.in === "path") path += `/{${paramName}}`;
            prms.push(paramName);
            localHparams[paramName] = paramDetails;
          }
        }
        const inner = await this.#generatePaths(
          (await value.action(
            prms ? Object.fromEntries(prms.map((p) => [p, p])) : {},
            null,
            {},
          )) as APIInterface,
          path,
          localHparams,
          value.tag ?? null,
        );
        if (value.params) {
          for (const paramName of Object.keys(value.params))
            delete localHparams[paramName];
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
      const rootNorm = root.endsWith("/") ? root.slice(0, -1) : root;
      let path = `${rootNorm}/${key}`;
      if (value.api === true && typeof value.action === "function") {
        tags.push({
          name: value.tag || path,
          description: value.description || "",
        });
        let prms: Record<string, string | number | boolean> = {};
        if (value.params) {
          for (const [paramName, paramDetails] of Object.entries(
            value.params,
          )) {
            if (paramDetails.in === "path") path += `/{${paramName}}`;
            prms[paramName] = paramName;
          }
        }
        const inner = await this.#generateTags(
          (await value.action(prms, null, {})) as APIInterface,
          path,
        );
        tags = [...tags, ...inner];
      }
    }
    return tags;
  }

  #slug(path: string): string {
    if (path.startsWith("/")) path = path.slice(1);
    if (path.endsWith("/")) path = path.slice(0, -1);
    return path.replace(/\//g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  }
}
