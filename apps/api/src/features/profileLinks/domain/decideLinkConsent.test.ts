import { describe, expect, it } from 'vitest';
import { decideLinkConsent } from './decideLinkConsent.js';
import type { LinkAccount, LinkProfile } from './ProfileLink.js';

const at = new Date('2026-11-02T03:00:00Z');
const account: LinkAccount = { id: 'a-1', displayName: 'Mẹ', healthProfileId: null };
const profile = (patch: Partial<LinkProfile> = {}): LinkProfile => ({
  id: 'p-1',
  displayName: 'Mẹ',
  consentStatus: 'pending',
  consentWithdrawnAt: null,
  ...patch,
});

describe('decideLinkConsent — hệ quả đồng thuận của link liên kết (SPEC-040)', () => {
  it.each(['pending', 'invited', 'declined', 'withdrawn', 'confirmed'] as const)(
    'TC-450/574: đồng ý ở trạng thái %s → confirmed nguồn self, tên và người xác nhận là tài khoản',
    (consentStatus) => {
      expect(decideLinkConsent(profile({ consentStatus }), 'accepted', account, at)).toEqual({
        consentStatus: 'confirmed',
        consentSource: 'self',
        consentBasis: 'self',
        consentRespondentName: 'Mẹ',
        consentConfirmedBy: 'a-1',
        consentConfirmedAt: at,
      });
    },
  );
  it('TC-575: từ chối hồ sơ confirmed → withdrawn, ghi người rút là tài khoản phiên', () => {
    expect(decideLinkConsent(profile({ consentStatus: 'confirmed' }), 'declined', account, at)).toEqual({
      consentStatus: 'withdrawn',
      consentWithdrawnAt: at,
      consentWithdrawnBy: 'a-1',
    });
  });
  it.each(['pending', 'invited', 'declined'] as const)(
    'TC-575: từ chối hồ sơ chưa đồng thuận (%s) → declined',
    (consentStatus) => {
      expect(decideLinkConsent(profile({ consentStatus }), 'declined', account, at)).toEqual({
        consentStatus: 'declined',
      });
    },
  );
  it('TC-575: từ chối hồ sơ đã withdrawn → giữ nguyên', () => {
    const withdrawn = profile({ consentStatus: 'withdrawn', consentWithdrawnAt: at });
    expect(decideLinkConsent(withdrawn, 'declined', account, at)).toBeNull();
  });
});
