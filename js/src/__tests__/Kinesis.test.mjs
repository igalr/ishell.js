import { describe, it, expect } from 'vitest';
import { KinesisRecords, KinesisRecord } from '../aws/Kinesis.mjs';

const makeRecord = (data) => ({
  eventSource: 'aws:kinesis',
  eventSourceARN: 'arn:aws:kinesis:us-east-1:123:stream/MyStream',
  eventName: 'aws:kinesis:record',
  kinesis: {
    data: Buffer.from(JSON.stringify(data)).toString('base64'),
  },
});

describe('KinesisRecords', () => {
  it('wraps records array', () => {
    const payload = { Records: [makeRecord({ x: 1 }), makeRecord({ x: 2 })] };
    const kr = new KinesisRecords(payload);
    expect(kr.records).toHaveLength(2);
  });
  it('returns empty array when Records missing', () => {
    expect(new KinesisRecords({}).records).toHaveLength(0);
  });
  it('getRecord returns record by index', () => {
    const payload = { Records: [makeRecord({ x: 1 })] };
    const kr = new KinesisRecords(payload);
    expect(kr.getRecord(0)).toBeInstanceOf(KinesisRecord);
  });
});

describe('KinesisRecord', () => {
  it('throws when eventSource is not aws:kinesis', () => {
    expect(() => new KinesisRecord({ eventSource: 'aws:s3' })).toThrow('Not a Kinesis record');
  });
  it('exposes source and name', () => {
    const r = new KinesisRecord(makeRecord({ ok: true }));
    expect(r.source).toBe('arn:aws:kinesis:us-east-1:123:stream/MyStream');
    expect(r.name).toBe('aws:kinesis:record');
  });
  it('decodes and parses base64 data', () => {
    const r = new KinesisRecord(makeRecord({ value: 42 }));
    expect(r.data).toEqual({ value: 42 });
  });
  it('returns null when data is not valid JSON', () => {
    const badRecord = {
      eventSource: 'aws:kinesis',
      eventSourceARN: 'arn:x',
      eventName: 'test',
      kinesis: { data: Buffer.from('not-json').toString('base64') },
    };
    expect(new KinesisRecord(badRecord).data).toBeNull();
  });
});
