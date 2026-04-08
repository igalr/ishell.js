import { InputHandler } from './inputHandler.js';

export class S3Handler extends InputHandler {
  static isS3(_input: unknown): boolean {
    console.log('Not yet implemented S3Handler.isS3');
    return false;
  }

  static readonly identifier = '__s3__';

  constructor(input: unknown) {
    super('s3');
    this._path = S3Handler.identifier as unknown as string[];
    this._method = 'post';
    this._params = {};
    this._payload = input;
    this._format = 'json';
  }

  shortInputLog(input: unknown): string {
    return JSON.stringify(input);
  }
}
