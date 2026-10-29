import { describe, expect, it } from 'vitest';
import { createMemoryProfileRepository } from '@src/shared/test/createMemoryProfileRepository.js';
import { createProfile } from './createProfile.js';
import { confirmProfileConsent } from './confirmProfileConsent.js';
import type { ConsentConfirmation } from '../domain/ConsentConfirmation.js';

const at = new Date('2026-10-27T01:00:00Z');
const consent = {
  kind: 'attestation',
  attestation: true,
  basis: 'guardian',
  respondentName: '  Mẹ  ',
} as const;
async function fixture(linkedAccountId?: string) {
  const repository = createMemoryProfileRepository([
    { id: 'main', familyId: 'a', displayName: 'Người chăm', healthProfileId: null },
    { id: 'other', familyId: 'a', displayName: 'Người khác', healthProfileId: null },
  ]);
  const result = await createProfile(
    repository,
    'a',
    { birthYear: 1950, displayName: 'Bé', linkedAccountId },
    () => at,
    'main',
  );
  if (!result.ok) throw new Error(result.code);
  const confirm = (body: ConsentConfirmation = consent, family = 'a') =>
    confirmProfileConsent(repository, family, 'main', result.value.id, body, () => at);
  return { repository, profile: result.value, confirm };
}
describe('Xác nhận đồng thuận trong phiên main', () => {
  it.each(['pending', 'invited', 'declined'] as const)(
    'TC-551: chuyển %s thành confirmed',
    async (status) => {
      const f = await fixture();
      f.profile.consentStatus = status;
      expect(await f.confirm()).toMatchObject({
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
    },
  );
  it('TC-553: lịch sử rút và tài khoản khác chặn trước idempotent', async () => {
    const f = await fixture('other');
    f.profile.consentStatus = 'confirmed';
    expect(await f.confirm()).toEqual({ ok: false, code: 'ERR_CONSENT_INVITATION_REQUIRED' });
    const unlinked = await fixture();
    unlinked.profile.consentWithdrawnAt = at;
    expect(await unlinked.confirm()).toEqual({ ok: false, code: 'ERR_CONSENT_INVITATION_REQUIRED' });
  });
  it('TC-554: gọi lại không thay nguồn, người, thời điểm, tên và tư cách', async () => {
    const f = await fixture();
    await f.confirm();
    const before = structuredClone(f.profile);
    expect(await f.confirm({ ...consent, respondentName: 'Khác', basis: 'self' })).toEqual({
      ok: true,
      value: before,
    });
  });
  it('TC-555: chỉ tài khoản liên kết chính mình được self', async () => {
    const f = await fixture('main');
    expect(await f.confirm({ kind: 'self' })).toMatchObject({
      ok: true,
      value: {
        consentSource: 'self',
        consentBasis: 'self',
        consentRespondentName: 'Người chăm',
      },
    });
    expect(await f.confirm()).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(await (await fixture()).confirm({ kind: 'self' })).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });
  it('TC-556: gia đình khác không thấy hồ sơ', async () => {
    expect(await (await fixture()).confirm(consent, 'b')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
});
