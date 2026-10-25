import { describe, expect, it, vi } from 'vitest';
import type { DirectoryMember, LocalAccount } from '../domain/planIdpSync.js';
import { IdpDirectoryError } from './IdpDirectoryError.js';
import type { IdpSyncPolicy } from './ports.js';
import { syncIdpSessions } from './syncIdpSessions.js';

const NOW = new Date('2026-10-20T08:00:00Z');
const policy: IdpSyncPolicy = {
  accessGroupName: 'angia-sit-users',
  adminGroupName: 'angia-admins',
  maxRevokes: 10,
  dryRun: false,
  now: () => NOW,
};
const accounts: LocalAccount[] = [
  { id: 'locked', oidcSubject: 's1', isSystemAdmin: true, hasSession: true },
  { id: 'kept', oidcSubject: 's2', isSystemAdmin: false, hasSession: true },
];
const groups: Record<string, DirectoryMember[]> = {
  'angia-sit-users': [
    { uid: 's1', isActive: false },
    { uid: 's2', isActive: true },
  ],
  'angia-admins': [{ uid: 's1', isActive: false }],
};

function setup(fetchGroupMembers = async (name: string) => groups[name] ?? []) {
  const store = { listAccounts: vi.fn(async () => accounts), apply: vi.fn(async () => undefined) };
  const directory = { fetchGroupMembers: vi.fn(fetchGroupMembers) };
  return { store, directory, deps: { store, directory } };
}

describe('Đồng bộ phiên với IdP (SPEC-033)', () => {
  it('TC-329: IdP lỗi → outcome error đúng reason, không đọc/ghi DB', async () => {
    const { deps, store } = setup(async () => {
      throw new IdpDirectoryError('idp_http_403');
    });
    expect(await syncIdpSessions(deps, policy)).toMatchObject({
      outcome: 'error',
      reason: 'idp_http_403',
      revoke: [],
    });
    expect(store.listAccounts).not.toHaveBeenCalled();
    expect(store.apply).not.toHaveBeenCalled();
  });

  it('TC-329: chỉ nhóm admin lỗi trong khi nhóm truy cập đọc được → vẫn error, không thu hồi', async () => {
    const { deps, store } = setup(async (name) => {
      if (name === 'angia-admins') throw new IdpDirectoryError('idp_http_error', 502);
      return groups[name] ?? [];
    });
    expect(await syncIdpSessions(deps, policy)).toMatchObject({
      outcome: 'error',
      reason: 'idp_http_error',
      status: 502,
    });
    expect(store.apply).not.toHaveBeenCalled();
  });

  it('TC-329: lỗi không phải IdpDirectoryError → idp_unreachable', async () => {
    const { deps } = setup(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await syncIdpSessions(deps, policy)).toMatchObject({
      outcome: 'error',
      reason: 'idp_unreachable',
    });
  });

  it('TC-329: store ghi lỗi → outcome error, reason db_error', async () => {
    const { deps, store } = setup();
    store.apply.mockRejectedValueOnce(new Error('connection reset'));
    expect(await syncIdpSessions(deps, policy)).toMatchObject({ outcome: 'error', reason: 'db_error' });
  });

  it('TC-350: lỗi lạ và db_error kèm mã chẩn đoán (tên lỗi, mã pg) nhưng không kèm thông điệp gốc', async () => {
    const network = setup(async () => {
      throw Object.assign(new TypeError('fetch failed x@example.test'), { code: 'ECONNREFUSED' });
    });
    const unreachable = await syncIdpSessions(network.deps, policy);
    expect(unreachable).toMatchObject({
      outcome: 'error',
      reason: 'idp_unreachable',
      errorName: 'TypeError',
      errorCode: 'ECONNREFUSED',
    });

    const { deps, store } = setup();
    store.apply.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key (oidc_subject)=(s1)'), { name: 'DatabaseError', code: '23505' }),
    );
    const failed = await syncIdpSessions(deps, policy);
    expect(failed).toMatchObject({ reason: 'db_error', errorName: 'DatabaseError', errorCode: '23505' });
    expect(JSON.stringify([unreachable, failed])).not.toMatch(/example\.test|s1\)/);

    // Giá trị ném ra không phải Error, hoặc name/code bất thường → không ghi chẩn đoán đó.
    const odd = setup(async () => {
      throw Object.assign(new Error('x'), { name: 'Có dấu x@example.test', code: 'mã lạ' });
    });
    const oddResult = await syncIdpSessions(odd.deps, policy);
    expect(oddResult).not.toHaveProperty('errorName');
    expect(oddResult).not.toHaveProperty('errorCode');
    const thrown = setup();
    thrown.store.listAccounts.mockRejectedValueOnce('boom');
    expect(await syncIdpSessions(thrown.deps, policy)).not.toHaveProperty('errorName');
  });

  it('TC-329: có thay đổi → apply nhận đúng thay đổi; nhóm truy cập rỗng → skipped, không ghi', async () => {
    const { deps, store } = setup();
    const result = await syncIdpSessions(deps, policy);
    expect(result).toMatchObject({
      outcome: 'applied',
      revoke: ['locked'],
      adminOff: ['locked'],
      dryRun: false,
    });
    expect(store.listAccounts).toHaveBeenCalledWith(NOW);
    expect(store.apply).toHaveBeenCalledWith({ revoke: ['locked'], adminOn: [], adminOff: ['locked'] }, NOW);

    const empty = setup(async () => []);
    expect(await syncIdpSessions(empty.deps, policy)).toMatchObject({
      outcome: 'skipped',
      reason: 'access_group_empty',
    });
    expect(empty.store.apply).not.toHaveBeenCalled();
  });

  it('TC-329: không có thay đổi → không gọi apply', async () => {
    const { deps, store } = setup(async (name) =>
      name === 'angia-sit-users' ? [{ uid: 's2', isActive: true }] : [],
    );
    store.listAccounts.mockResolvedValueOnce([accounts[1]!]);
    expect(await syncIdpSessions(deps, policy)).toMatchObject({ outcome: 'applied', revoke: [] });
    expect(store.apply).not.toHaveBeenCalled();
  });

  it('TC-330: chạy thử không ghi DB nhưng đếm đúng', async () => {
    const { deps, store } = setup();
    expect(await syncIdpSessions(deps, { ...policy, dryRun: true })).toMatchObject({
      outcome: 'applied',
      revoke: ['locked'],
      adminOff: ['locked'],
      dryRun: true,
    });
    expect(store.apply).not.toHaveBeenCalled();
  });
});
