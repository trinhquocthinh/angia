import type { LocalIdentityLifecycle } from '../identity/application/LocalIdentityLifecycle.js';

interface FakeLocalAccount {
  accountId: string;
  lockedAt: Date | null;
  lockReason: string | null;
  credentialVersion: number;
  sessionIds: string[];
  pushIds: string[];
}

export function createFakeLocalIdentityLifecycle(seed: FakeLocalAccount[] = []) {
  const records = new Map(structuredClone(seed).map((record) => [record.accountId, record]));
  const change = (id: string, work: (record: FakeLocalAccount) => void) => {
    const record = records.get(id);
    if (!record) return Promise.resolve(false);
    work(record);
    return Promise.resolve(true);
  };
  const revoke = (record: FakeLocalAccount) => {
    record.credentialVersion++;
    record.sessionIds = [];
    record.pushIds = [];
  };
  const lifecycle: LocalIdentityLifecycle = {
    lock: (id, reason, now) =>
      change(id, (record) => {
        record.lockedAt = new Date(now);
        record.lockReason = reason;
        revoke(record);
      }),
    unlock: (id) =>
      change(id, (record) => {
        record.lockedAt = null;
        record.lockReason = null;
      }),
    revokeAll: (id) => change(id, revoke),
    deleteUser: (id) => Promise.resolve(records.delete(id)),
  };
  return { lifecycle, records };
}
