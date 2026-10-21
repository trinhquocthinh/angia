import { describe, expect, it } from 'vitest';
import { sendPushTest } from './sendPushTest.js';
import { registerPushSubscription } from './registerPushSubscription.js';
import type { PushDependencies } from './ports.js';
const actor = { familyId: 'f', accountId: 'a', sessionId: 's' };
const value = {
  endpoint: 'https://web.push.apple.com/x',
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
};
function setup(result: 'accepted' | 'gone' | 'failed' = 'accepted') {
  const calls: string[] = [];
  const deps: PushDependencies = {
    publicKey: 'public',
    now: () => new Date(0),
    repository: {
      read: async () => value,
      save: async () => {
        calls.push('save');
        return 'saved';
      },
      remove: async () => {
        calls.push('remove');
      },
    },
    sender: {
      send: async (sub) => {
        calls.push(sub.endpoint);
        return result;
      },
    },
  };
  return { deps, calls };
}
describe('Web Push cá nhân', () => {
  it('TC-343: gửi đúng đăng ký đọc qua scope', async () => {
    const { deps, calls } = setup();
    expect(await sendPushTest(deps, actor)).toBe('accepted');
    expect(calls).toEqual([value.endpoint]);
  });
  it('TC-342: đăng ký thiếu/hết phiên không gửi', async () => {
    const { deps, calls } = setup();
    deps.repository.read = async () => null;
    expect(await sendPushTest(deps, actor)).toBe('missing');
    expect(calls).toEqual([]);
  });
  it('TC-349: 404/410 gỡ đúng đăng ký, lỗi tạm không gỡ', async () => {
    const gone = setup('gone');
    expect(await sendPushTest(gone.deps, actor)).toBe('gone');
    expect(gone.calls).toEqual([value.endpoint, 'remove']);
    const failed = setup('failed');
    await sendPushTest(failed.deps, actor);
    expect(failed.calls).toEqual([value.endpoint]);
  });
  it('TC-340: tắt tính năng hoặc URL sai không ghi DB', async () => {
    const { deps, calls } = setup();
    deps.publicKey = null;
    expect(await registerPushSubscription(deps, actor, value)).toBe('disabled');
    deps.publicKey = 'public';
    expect(await registerPushSubscription(deps, actor, { ...value, endpoint: 'http://localhost/x' })).toBe(
      'invalid',
    );
    expect(calls).toEqual([]);
    expect(await registerPushSubscription(deps, actor, value)).toBe('saved');
  });
});
