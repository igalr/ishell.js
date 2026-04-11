import { describe, it, expect } from 'vitest';
import {
  ResponseJSON, ResponseText, ResponseHTML, ResponseXML,
  ResponseCSV, ResponseJSON2CSV
} from '../response.mjs';

describe('ResponseJSON', () => {
  it('has application/json content type', () => {
    const r = new ResponseJSON({ foo: 'bar' });
    expect(r.contentType).toBe('application/json');
    expect(r.content).toEqual({ foo: 'bar' });
    expect(r.returnCode).toBe(200);
  });
  it('errorCode() sets returnCode and returns self', () => {
    const r = new ResponseJSON({});
    const same = r.errorCode(404);
    expect(same).toBe(r);
    expect(r.returnCode).toBe(404);
  });
});

describe('ResponseText', () => {
  it('has text/plain content type', () => {
    expect(new ResponseText('hello').contentType).toBe('text/plain');
  });
});

describe('ResponseHTML', () => {
  it('has text/html content type', () => {
    expect(new ResponseHTML('<p/>').contentType).toBe('text/html');
  });
});

describe('ResponseXML', () => {
  it('has text/xml content type', () => {
    expect(new ResponseXML('<x/>').contentType).toBe('text/xml');
  });
});

describe('ResponseCSV', () => {
  it('has text/csv content type', () => {
    expect(new ResponseCSV('a,b').contentType).toBe('text/csv');
  });
});

describe('ResponseJSON2CSV', () => {
  it('converts array of objects to CSV string', () => {
    const r = new ResponseJSON2CSV([{ a: 1, b: 2 }, { a: 3, b: 4 }]);
    expect(r.contentType).toBe('text/csv');
    expect(r.content).toBe('a,b\n1,2\n3,4');
  });
  it('returns empty string for empty array', () => {
    expect(new ResponseJSON2CSV([]).content).toBe('');
  });
  it('escapes commas in string values', () => {
    const r = new ResponseJSON2CSV([{ name: 'a,b' }]);
    expect(r.content).toBe('name\n"a,b"');
  });
  it('escapes double quotes in string values', () => {
    const r = new ResponseJSON2CSV([{ name: 'say "hi"' }]);
    expect(r.content).toBe('name\n"say ""hi"""');
  });
});
