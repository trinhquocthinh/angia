import { describe, expect, it } from 'vitest';
import { createProfile } from './createProfile.js';
import { listProfiles } from './listProfiles.js';
import { listLinkableAccounts } from './listLinkableAccounts.js';
import { createMemoryProfileRepository } from '@src/shared/test/createMemoryProfileRepository.js';

const now = () => new Date('2026-10-05T17:30:00Z');

describe('Hồ sơ và đồng thuận', () => {
  it('TC-008: tạo hồ sơ độc lập đúng nhóm và chưa xác nhận đồng thuận', async () => {
    const repository = createMemoryProfileRepository();
    const result = await createProfile(repository, 'family-a', { displayName: ' Bé An ' }, now);
    expect(result).toMatchObject({
      ok: true,
      value: { familyId: 'family-a', displayName: 'Bé An', consentConfirmedAt: null },
    });
    expect(await listProfiles(repository, 'family-a')).toHaveLength(1);
    expect(await listProfiles(repository, 'family-b')).toEqual([]);
  });
  it('TC-009: liên kết lần đầu thành công, lần sau bị từ chối', async () => {
    const repository = createMemoryProfileRepository([
      { id: 'account-a', familyId: 'family-a', displayName: 'Mẹ', healthProfileId: null },
    ]);
    const input = { displayName: 'Mẹ', linkedAccountId: 'account-a' };
    expect(await createProfile(repository, 'family-a', input, now)).toMatchObject({ ok: true });
    expect(await createProfile(repository, 'family-a', input, now)).toEqual({
      ok: false,
      code: 'ERR_PROFILE_ALREADY_LINKED',
    });
    expect(await listProfiles(repository, 'family-a')).toHaveLength(1);
    expect(await listLinkableAccounts(repository, 'family-a')).toEqual([]);
  });
  it('TC-010: tài khoản khác gia đình và không tồn tại đều bị từ chối', async () => {
    const repository = createMemoryProfileRepository([
      { id: 'other', familyId: 'family-b', displayName: 'Khác', healthProfileId: null },
    ]);
    for (const linkedAccountId of ['other', 'missing']) {
      expect(
        await createProfile(repository, 'family-a', { displayName: 'An', linkedAccountId }, now),
      ).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    }
    expect(await listProfiles(repository, 'family-a')).toEqual([]);
  });
  it.each([1899, 2027, 2026.5])('năm sinh %s không hợp lệ theo đồng hồ Việt Nam', async (birthYear) => {
    expect(
      await createProfile(createMemoryProfileRepository(), 'a', { displayName: 'An', birthYear }, now),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });
  it.each([1900, 2026])('chấp nhận năm sinh biên %s', async (birthYear) => {
    expect(
      await createProfile(createMemoryProfileRepository(), 'a', { displayName: 'An', birthYear }, now),
    ).toMatchObject({ ok: true, value: { birthYear } });
  });
  it('năm hiện tại tính theo Việt Nam tại giao năm, tên không hợp lệ bị từ chối', async () => {
    const repository = createMemoryProfileRepository();
    const clock = () => new Date('2025-12-31T17:00:00Z');
    expect(await createProfile(repository, 'a', { displayName: 'An', birthYear: 2026 }, clock)).toMatchObject(
      { ok: true },
    );
    for (const displayName of ['', '   ', 'a'.repeat(61)]) {
      expect(await createProfile(repository, 'a', { displayName }, now)).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
    }
  });
});
