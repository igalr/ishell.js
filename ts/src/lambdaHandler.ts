import type { APIInterface } from './API.js';

export async function handleLambdaTrigger(input: unknown, _target: APIInterface): Promise<unknown> {
  return { statusCode: 200, body: JSON.stringify(input) };
}
