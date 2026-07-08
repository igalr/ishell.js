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
  // CLAUDE: this test needs to catch a NotFoundError rather than returning null, since the matchHandler function throws NotFoundError for unrecognized input. Adjusting the test accordingly.
  it('throws NotFoundError for unrecognized input', () => {
    const input = { unknown: 'data' };
    expect(() => handlers.matchHandler(input)).toThrowError('No handler found for input');
  });
  // it('returns null when no handler matches', () => {
  //   expect(handlers.matchHandler({})).toBeNull();
  // });
});
