import { describe, it, expect } from 'vitest';
import { AmazonConnectHandler } from '../handlers/amazonConnect.js';
import { ResponseJSON } from '../response.js';

const makeInput = (overrides: Record<string, unknown> = {}) => ({
  Name: 'ContactFlowEvent',
  Details: {
    Parameters: { path: 'v1/greet', customKey: 'abc' },
    ContactData: {
      ContactId: 'cid-123',
      Attributes: { method: 'get' },
      SystemEndpoint: { Address: '+1555' },
      CustomerEndpoint: { Address: '+1999' },
      InitiationMethod: 'INBOUND',
      InstanceARN: 'arn:aws:...',
    },
  },
  ...overrides,
});

describe('AmazonConnectHandler.isAmazonConnect', () => {
  it('returns true for a valid ContactFlowEvent', () => {
    expect(AmazonConnectHandler.isAmazonConnect(makeInput())).toBe(true);
  });
  it('returns false when Name is wrong', () => {
    expect(AmazonConnectHandler.isAmazonConnect({ Name: 'Other', Details: { ContactData: {} } })).toBe(false);
  });
  it('returns false when Details missing', () => {
    expect(AmazonConnectHandler.isAmazonConnect({ Name: 'ContactFlowEvent' })).toBe(false);
  });
  it('returns false when ContactData missing', () => {
    expect(AmazonConnectHandler.isAmazonConnect({ Name: 'ContactFlowEvent', Details: {} })).toBe(false);
  });
});

describe('AmazonConnectHandler', () => {
  it('parses path from Parameters', () => {
    const h = new AmazonConnectHandler(makeInput());
    expect(h.path).toEqual(['v1', 'greet']);
  });
  it('sets contactid in params', () => {
    const h = new AmazonConnectHandler(makeInput());
    expect(h.params['contactid']).toBe('cid-123');
  });
  it('exposes initMethod and contactid', () => {
    const h = new AmazonConnectHandler(makeInput());
    expect(h.initMethod).toBe('INBOUND');
    expect(h.contactid).toBe('cid-123');
  });
  it('processResponse throws because ResponseJSON content is now a pre-serialized string', () => {
    // ResponseJSON.content is now JSON.stringify()'d up front, but processResponse
    // still assumes an object and tries to set a property on it.
    const h = new AmazonConnectHandler(makeInput());
    const resp = new ResponseJSON({ greeting: 'hello' });
    expect(() => h.processResponse(resp)).toThrow(TypeError);
  });
});
