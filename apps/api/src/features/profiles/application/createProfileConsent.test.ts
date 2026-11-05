import { describe, expect, it } from 'vitest';
import { createMemoryProfileRepository } from '@src/shared/test/createMemoryProfileRepository.js';
import { createProfile } from './createProfile.js';
import { listProfiles } from './listProfiles.js';

const at = new Date('2026-10-27T01:00:00Z');
const now = () => at;
const consent = {
  kind: 'attestation' as const,
  attestation: true as const,
  basis: 'guardian' as const,
  respondentName: '  Mẹ ',
};
const account = { id: 'main', familyId: 'a', displayName: '  Nguyễn An ', healthProfileId: null };
describe('Tạo hồ sơ kèm receipt đồng thuận', () => {
  it('TC-549: cam kết tạo receipt đúng người, thời điểm và tên chuẩn hóa', async () => {
    const repository = createMemoryProfileRepository();
    expect(
      await createProfile(repository, 'a', { birthYear: 1950, displayName: 'Bé', consent }, now, 'main'),
    ).toMatchObject({
      ok: true,
      value: {
        consentStatus: 'confirmed',
        consentSource: 'main_attested',
        consentConfirmedBy: 'main',
        consentConfirmedAt: at,
        consentBasis: 'guardian',
        consentRespondentName: 'Mẹ',
      },
    });
  });
  it('TC-550: bỏ consent vẫn tạo pending', async () => {
    expect(
      await createProfile(
        createMemoryProfileRepository(),
        'a',
        { birthYear: 1950, displayName: 'Bé' },
        now,
        'main',
      ),
    ).toMatchObject({
      ok: true,
      value: { consentStatus: 'pending', consentSource: null, consentConfirmedAt: null },
    });
  });
  it('TC-555: tự xác nhận dùng tên tài khoản, không dùng tên hồ sơ', async () => {
    const repository = createMemoryProfileRepository([{ ...account }]);
    expect(
      await createProfile(
        repository,
        'a',
        { birthYear: 1950, displayName: 'Tên khác', linkedAccountId: 'main', consent: { kind: 'self' } },
        now,
        'main',
      ),
    ).toMatchObject({
      ok: true,
      value: {
        consentStatus: 'confirmed',
        consentSource: 'self',
        consentConfirmedBy: 'main',
        consentBasis: 'self',
        consentRespondentName: 'Nguyễn An',
      },
    });
  });
  it.each([
    { consent: { ...consent, respondentName: ' ' } },
    { consent: { ...consent, respondentName: 'a'.repeat(61) } },
    { consent, linkedAccountId: 'main' },
    { consent: { kind: 'self' as const } },
    { consent: { kind: 'self' as const }, linkedAccountId: 'other' },
  ])('TC-552: không tạo hồ sơ hoặc liên kết khi cam kết sai %j', async (input) => {
    const repository = createMemoryProfileRepository([{ ...account }, { ...account, id: 'other' }]);
    expect(
      await createProfile(repository, 'a', { birthYear: 1950, displayName: 'Bé', ...input }, now, 'main'),
    ).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(await listProfiles(repository, 'a', 'main')).toEqual([]);
  });
});
