import { describe, expect, it, vi } from 'vitest';
import { createWebPushSender } from './createWebPushSender.js';

const value = {
  endpoint: 'https://web.push.apple.com/a',
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
};
const vapid = { publicKey: 'public', privateKey: 'private', subject: 'mailto:operator@example.com' };
const options = { ttlSeconds: 3600, urgency: 'normal' as const };

function senderWith(result: unknown, rejected = false) {
  const sendNotification = vi.fn(() => (rejected ? Promise.reject(result) : Promise.resolve(result)));
  return { sendNotification, sender: createWebPushSender(vapid, { sendNotification }) };
}
const outcome = (error: unknown) => senderWith(error, true).sender.send(value, { type: 'x' }, options);

describe('Bộ gửi Web Push dùng chung', () => {
  it('TC-351: 201 là accepted và truyền đúng tùy chọn xuống thư viện', async () => {
    const { sender, sendNotification } = senderWith({ statusCode: 201 });
    expect(await sender.send(value, { type: 'reminder' }, options)).toEqual({ kind: 'accepted' });
    const call = sendNotification.mock.calls[0] as unknown as [unknown, string, Record<string, unknown>];
    expect(call[1]).toBe('{"type":"reminder"}');
    expect(call[2]).toEqual({ vapidDetails: vapid, TTL: 3600, urgency: 'normal', timeout: 15_000 });
  });
  it('TC-351: 404 và 410 là gone', async () => {
    expect(await outcome({ statusCode: 404 })).toEqual({ kind: 'gone' });
    expect(await outcome({ statusCode: 410 })).toEqual({ kind: 'gone' });
  });
  it('TC-351: 429 kèm Retry-After; 5xx; timeout; lỗi mạng là retry', async () => {
    expect(await outcome({ statusCode: 429, headers: { 'retry-after': '30' } })).toEqual({
      kind: 'retry',
      code: 'http_429',
      retryAfterSeconds: 30,
    });
    expect(await outcome({ statusCode: 429 })).toEqual({ kind: 'retry', code: 'http_429' });
    expect(await outcome({ statusCode: 500 })).toEqual({ kind: 'retry', code: 'http_5xx' });
    expect(await outcome({ statusCode: 503 })).toEqual({ kind: 'retry', code: 'http_5xx' });
    for (const code of ['ETIMEDOUT', 'ESOCKETTIMEDOUT']) {
      expect(await outcome({ code })).toEqual({ kind: 'retry', code: 'timeout' });
    }
    for (const code of ['ECONNRESET', 'ENOTFOUND']) {
      expect(await outcome({ code })).toEqual({ kind: 'retry', code: 'network' });
    }
  });
  it('TC-351: 401, 403, 413 là rejected http_4xx', async () => {
    for (const statusCode of [401, 403, 413]) {
      expect(await outcome({ statusCode })).toEqual({ kind: 'rejected', code: 'http_4xx' });
    }
  });
  it('TC-351: thiếu VAPID hoặc đích ngoài danh sách cho phép không gọi thư viện', async () => {
    const sendNotification = vi.fn();
    const disabled = createWebPushSender(null, { sendNotification });
    expect(await disabled.send(value, {}, options)).toEqual({ kind: 'rejected', code: 'disabled' });
    const enabled = createWebPushSender(vapid, { sendNotification });
    expect(await enabled.send({ ...value, endpoint: 'http://localhost' }, {}, options)).toEqual({
      kind: 'rejected',
      code: 'not_allowed',
    });
    expect(sendNotification).not.toHaveBeenCalled();
  });
});
