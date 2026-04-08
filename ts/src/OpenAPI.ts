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
