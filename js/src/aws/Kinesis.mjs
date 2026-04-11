export class KinesisRecords {
    #records; get records() { return this.#records; }

    constructor (payload) {
        this.#records = (payload?.Records || []).map (record => new KinesisRecord(record));
    }

    getRecord (index) {
        return this.#records[index];
    }
}

export class KinesisRecord {
    #record; get record() { return this.#record; }

    constructor (record) {
        if (record.eventSource !== "aws:kinesis") {
            throw new Error ("Not a Kinesis record");
        }
        this.#record = record;
    }

    get source () {
        return this.#record.eventSourceARN;
    }
    get name () {
        return this.#record.eventName;
    }
    
    get data() {
        try {
            const buf = Buffer.from(this.#record.kinesis?.data, 'base64');
            const str = buf.toString('utf-8');
            return JSON.parse(str);
        } catch (err) {
            console.error ("Error parsing Kinesis record data", err);
            return null;
        }
    }
}