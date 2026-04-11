import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ MessageId: 'mock-id' }),
  })),
  PublishCommand: vi.fn().mockImplementation((input) => ({ input })),
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromIni: vi.fn().mockReturnValue({ accessKeyId: 'test', secretAccessKey: 'test' }),
}));

import { SNSPublisher } from '../../notifications/SNSPublisher.mjs';
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
    const callArg = vi.mocked(SNSClient).mock.calls[0][0];
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
