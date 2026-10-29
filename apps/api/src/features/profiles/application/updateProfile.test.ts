import { describe, expect, it } from 'vitest';
import type { ConsentStatus } from '../domain/HealthProfile.js';
import { createMemoryProfileRepository } from '@src/shared/test/createMemoryProfileRepository.js';
import { createProfile } from './createProfile.js';
import { updateProfile } from './updateProfile.js';

const now = () => new Date('2026-06-01T00:00:00Z');

async function fixture(status: ConsentStatus = 'pending') {
  const repository = createMemoryProfileRepository();
  const result = await createProfile(
    repository,
    'family-a',
    { displayName: 'Bé An', birthYear: 2020 },
    now,
    'main',
  );
  if (!result.ok) throw new Error('Không tạo được hồ sơ kiểm thử');
  const profile = result.value;
  profile.consentStatus = status;
  return { repository, profile };
}

describe('Sửa năm sinh và lựa chọn theo dõi số đo', () => {
  it('TC-443: bật lưu true, tắt lưu NULL và giữ trường không được gửi', async () => {
    const { repository, profile } = await fixture();
    const before = { ...profile };
    expect(await updateProfile(repository, 'family-a', profile.id, { vitalsEnabled: true }, now)).toEqual({
      ok: true,
      value: { ...before, vitalsEnabled: true },
    });
    expect(await updateProfile(repository, 'family-a', profile.id, { birthYear: 1980 }, now)).toEqual({
      ok: true,
      value: { ...before, birthYear: 1980, vitalsEnabled: true },
    });
    expect(await updateProfile(repository, 'family-a', profile.id, { vitalsEnabled: false }, now)).toEqual({
      ok: true,
      value: { ...before, birthYear: 1980, vitalsEnabled: null },
    });
  });

  it.each([1899, 2027, 2000.5, NaN])('TC-443: năm %s sai không thay đổi hồ sơ', async (birthYear) => {
    const { repository, profile } = await fixture();
    const before = { ...profile };
    expect(
      await updateProfile(repository, 'family-a', profile.id, { birthYear, vitalsEnabled: true }, now),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(profile).toEqual(before);
  });

  it('TC-443: từ chối bản sửa rỗng', async () => {
    const { repository, profile } = await fixture();
    expect(await updateProfile(repository, 'family-a', profile.id, {}, now)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it.each(['pending', 'invited', 'declined', 'confirmed'] as const)(
    'TC-443: trạng thái %s vẫn sửa được theo SPEC-039',
    async (status) => {
      const { repository, profile } = await fixture(status);
      expect(await updateProfile(repository, 'family-a', profile.id, { birthYear: 2021 }, now)).toMatchObject(
        { ok: true, value: { birthYear: 2021, consentStatus: status } },
      );
    },
  );

  it('TC-443: withdrawn bị chặn và không thay đổi hồ sơ', async () => {
    const { repository, profile } = await fixture('withdrawn');
    const before = { ...profile };
    expect(await updateProfile(repository, 'family-a', profile.id, { birthYear: 2021 }, now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(profile).toEqual(before);
  });

  it('TC-443: hồ sơ khác gia đình và không tồn tại đều trả ERR_NOT_FOUND', async () => {
    const { repository, profile } = await fixture();
    const before = { ...profile };
    for (const id of [profile.id, 'missing']) {
      expect(await updateProfile(repository, 'family-b', id, { vitalsEnabled: true }, now)).toEqual({
        ok: false,
        code: 'ERR_NOT_FOUND',
      });
    }
    expect(profile).toEqual(before);
  });

  it('TC-443: bổ sung năm sinh cho hồ sơ cũ và sửa hai trường cùng lúc', async () => {
    const { repository, profile } = await fixture();
    profile.birthYear = null;
    expect(
      await updateProfile(repository, 'family-a', profile.id, { birthYear: 2026, vitalsEnabled: true }, now),
    ).toMatchObject({ ok: true, value: { birthYear: 2026, vitalsEnabled: true } });
  });
});
