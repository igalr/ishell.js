interface RawKinesisRecord {
  eventSource: string;
  eventSourceARN: string;
  eventName: string;
  kinesis?: { data: string };
}

export class KinesisRecords {
  readonly #records: KinesisRecord[];
  get records(): KinesisRecord[] { return this.#records; }

  constructor(payload: any) {
    const p = payload as { Records?: RawKinesisRecord[] };
    this.#records = (p?.Records || []).map(record => new KinesisRecord(record));
  }

  getRecord(index: number): KinesisRecord {
    return this.#records[index];
  }
}

export class KinesisRecord {
  readonly #record: RawKinesisRecord;
  get record(): RawKinesisRecord { return this.#record; }

  constructor(record: RawKinesisRecord) {
    if (record.eventSource !== 'aws:kinesis') {
      throw new Error('Not a Kinesis record');
    }
    this.#record = record;
  }

  get source(): string { return this.#record.eventSourceARN; }
  get name(): string { return this.#record.eventName; }

  get data(): any {
    try {
      const buf = Buffer.from(this.#record.kinesis?.data ?? '', 'base64');
      const str = buf.toString('utf-8');
      return JSON.parse(str);
    } catch (err) {
      console.error('Error parsing Kinesis record data', err);
      return null;
    }
  }
}
