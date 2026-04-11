import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationChannel } from '../../notifications/NotificationChannel.mjs';

describe('NotificationChannel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes url', () => {
    const nc = new NotificationChannel('https://hooks.example.com/abc');
    expect(nc.url).toBe('https://hooks.example.com/abc');
  });

  it('posts message to url and returns sent status', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({ ok: true });

    const nc = new NotificationChannel('https://hooks.example.com/abc');
    const result = await nc.notify('hello world');
    expect(result.status).toBe('sent');
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.example.com/abc');
    const body = JSON.parse(opts.body);
    expect(body.text).toBe('"hello world"');
  });

  it('includes threadKey when threadkey provided', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true });
    const nc = new NotificationChannel('https://hooks.example.com/abc');
    await nc.notify('msg', 'thread-1');
    const [, opts] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.thread.threadKey).toBe('thread-1');
  });

  it('returns not_sent on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    const nc = new NotificationChannel('https://hooks.example.com/abc');
    const result = await nc.notify('msg');
    expect(result.status).toBe('not_sent');
    expect(result.reason).toBe('network down');
  });
});
