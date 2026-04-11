import { describe, it, expect } from 'vitest';
import {
  BaseError, NotFoundError, MissingValueError, AuthError,
  SystemError, NotAllowedError, BadFormatError, NotImplementedError
} from '../errors.js';

describe('BaseError', () => {
  it('is an instance of Error', () => {
    const err = new NotFoundError();
    expect(err instanceof Error).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 and name NotFoundError', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('NotFoundError');
    expect(err.message).toBe('Not Found');
  });
  it('accepts a custom message', () => {
    const err = new NotFoundError('item missing');
    expect(err.message).toBe('item missing');
  });
});

describe('AuthError', () => {
  it('has statusCode 401', () => {
    expect(new AuthError().statusCode).toBe(401);
  });
});

describe('MissingValueError', () => {
  it('has statusCode 501', () => {
    expect(new MissingValueError().statusCode).toBe(501);
  });
});

describe('SystemError', () => {
  it('has statusCode 500', () => {
    expect(new SystemError().statusCode).toBe(500);
  });
});

describe('NotAllowedError', () => {
  it('has statusCode 403', () => {
    expect(new NotAllowedError().statusCode).toBe(403);
  });
});

describe('BadFormatError', () => {
  it('has statusCode 400', () => {
    expect(new BadFormatError().statusCode).toBe(400);
  });
});

describe('NotImplementedError', () => {
  it('has statusCode 501', () => {
    expect(new NotImplementedError().statusCode).toBe(501);
  });
});
