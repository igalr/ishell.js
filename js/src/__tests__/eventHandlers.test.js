import { describe, it, expect } from 'vitest';
import { KinesistHandler } from '../handlers/KinesisHandler.js';
import { S3Handler } from '../handlers/S3Handler.js';
import { SNSHandler } from '../handlers/SNSHandler.js';

const kinesisInput = {
  Records: [{ eventSource: 'aws:kinesis', data: 'test' }],
};

const snsInput = {
  Records: [
    {
      EventSource: 'aws:sns',
      Sns: { Message: JSON.stringify({ event: 'order.placed' }) },
    },
  ],
};

const s3Input = {
  Records: [
    {
      eventSource: 'aws:s3',
      eventName: 'ObjectCreated:Put',
      s3: {
        bucket: { name: 'my-bucket' },
        object: { key: 'uploads/photo.jpg', size: 4096 },
      },
    },
  ],
};

describe('KinesistHandler.isKinesis', () => {
  it('returns true for kinesis input', () => {
    expect(KinesistHandler.isKinesis(kinesisInput)).toBe(true);
  });
  it('returns false for non-kinesis input', () => {
    expect(KinesistHandler.isKinesis({ Records: [{ eventSource: 'aws:s3' }] })).toBe(false);
  });
});

describe('KinesistHandler', () => {
  it('sets path to __kinesis__ identifier', () => {
    const h = new KinesistHandler(kinesisInput);
    expect(h.path).toBe(KinesistHandler.identifier);
    expect(h.method).toBe('post');
  });
  it('sets payload to the full input', () => {
    const h = new KinesistHandler(kinesisInput);
    expect(h.payload).toEqual(kinesisInput);
  });
});

describe('S3Handler.isS3', () => {
  it('returns true for S3 input', () => {
    expect(S3Handler.isS3(s3Input)).toBe(true);
  });
  it('returns false for non-S3 input', () => {
    expect(S3Handler.isS3({ Records: [{ eventSource: 'aws:kinesis' }] })).toBe(false);
  });
  it('returns false for empty input', () => {
    expect(S3Handler.isS3({})).toBe(false);
  });
});

describe('S3Handler', () => {
  it('sets path to __s3__ identifier', () => {
    const h = new S3Handler(s3Input);
    expect(h.path).toBe(S3Handler.identifier);
    expect(h.method).toBe('post');
  });
  it('distills S3 records into summaries', () => {
    const h = new S3Handler(s3Input);
    expect(h.payload).toEqual([
      { eventName: 'ObjectCreated:Put', bucket: 'my-bucket', key: 'uploads/photo.jpg', size: 4096 },
    ]);
  });
});

describe('SNSHandler.isSNS', () => {
  it('returns true for sns input', () => {
    expect(SNSHandler.isSNS(snsInput)).toBe(true);
  });
  it('returns false for non-sns input', () => {
    expect(SNSHandler.isSNS({ Records: [{ EventSource: 'aws:kinesis' }] })).toBe(false);
  });
});

describe('SNSHandler', () => {
  it('distills SNS messages from Records', () => {
    const h = new SNSHandler(snsInput);
    expect(h.payload).toEqual([{ event: 'order.placed' }]);
  });
  it('sets path to __sns__ identifier', () => {
    const h = new SNSHandler(snsInput);
    expect(h.path).toBe(SNSHandler.identifier);
  });
});
