import { InputHandler } from './inputHandler.js';

interface S3Record {
  eventName: string;
  s3: {
    bucket: { name: string };
    object: { key: string; size: number };
  };
}

interface S3Event {
  Records: S3Record[];
}

export interface S3EventSummary {
  eventName: string;
  bucket: string;
  key: string;
  size: number;
}

export class S3Handler extends InputHandler {
  static isS3(input: unknown): boolean {
    const i = input as { Records?: { eventSource?: string }[] };
    return i?.Records?.[0]?.eventSource === 'aws:s3';
  }

  static readonly identifier = '__s3__';

  constructor(input: unknown) {
    super('s3');
    this._path = S3Handler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = S3Handler.distill(input as S3Event);
    this._format = 'json';
  }

  private static distill(input: S3Event): S3EventSummary[] {
    return (input?.Records ?? []).map(record => ({
      eventName: record.eventName,
      bucket: record.s3?.bucket?.name,
      key: record.s3?.object?.key,
      size: record.s3?.object?.size,
    }));
  }

  shortInputLog(input: unknown): string {
    const i = input as S3Event;
    const first = i?.Records?.[0];
    const bucket = first?.s3?.bucket?.name ?? '?';
    const key = first?.s3?.object?.key ?? '?';
    return `S3 ${first?.eventName ?? 'event'}: s3://${bucket}/${key}`;
  }
}
