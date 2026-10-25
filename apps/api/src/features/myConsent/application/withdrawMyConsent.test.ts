import { describe, expect, it, vi } from 'vitest';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { MyConsentRepository } from './ports.js';
import { withdrawMyConsent } from './withdrawMyConsent.js';

const NOW = new Date('2026-10-24T03:00:00.000Z');
const actor = { familyId: 'f1', accountId: 'a1', healthProfileId: 'p1' as string | null };

function setup(consentStatus: ConsentStatus | null) {
  const markWithdrawn = vi.fn(() => Promise.resolve());
  const repository: MyConsentRepository = {
    withFamily: (_familyId, work) =>
      work({
        readProfile: () => Promise.resolve(null),
        lockProfile: () =>
          Promise.resolve(consentStatus ? { id: 'p1', displayName: 'Bà Tư', consentStatus } : null),
        markWithdrawn,
      }),
  };
  return { repository, markWithdrawn };
}

describe('withdrawMyConsent', () => {
  it('TC-378: hồ sơ đã đồng thuận thì ghi rút đúng một lần với thời điểm hiện tại', async () => {
    const { repository, markWithdrawn } = setup('confirmed');
    const result = await withdrawMyConsent(repository, actor, () => NOW);
    expect(result).toEqual({ ok: true, value: { consentStatus: 'withdrawn', withdrawnAt: NOW } });
    expect(markWithdrawn).toHaveBeenCalledTimes(1);
    expect(markWithdrawn).toHaveBeenCalledWith('p1', 'a1', NOW);
  });
  it('TC-378: chưa đồng thuận thì lỗi 409 và không ghi', async () => {
    const { repository, markWithdrawn } = setup('withdrawn');
    expect(await withdrawMyConsent(repository, actor, () => NOW)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_NOT_CONFIRMED',
    });
    expect(markWithdrawn).not.toHaveBeenCalled();
  });
  it('TC-378: không liên kết hồ sơ hoặc không thấy hồ sơ thì ERR_NOT_FOUND và không ghi', async () => {
    const missing = setup(null);
    expect(await withdrawMyConsent(missing.repository, actor, () => NOW)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    const unlinked = setup('confirmed');
    const result = await withdrawMyConsent(
      unlinked.repository,
      { ...actor, healthProfileId: null },
      () => NOW,
    );
    expect(result).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(missing.markWithdrawn).not.toHaveBeenCalled();
    expect(unlinked.markWithdrawn).not.toHaveBeenCalled();
  });
});
