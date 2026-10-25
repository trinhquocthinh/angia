import { describe, expect, it } from 'vitest';
import { isConsentInvitationRoute } from './isConsentInvitationRoute';
describe('TC-106 — Ngoại lệ xác thực lời mời', () => {
  it('chỉ chấp nhận exact path không chấp nhận prefix hoặc slash', () => {
    expect(isConsentInvitationRoute('/consent-invite')).toBe(true);
    for (const path of ['/', '/consent-invite/', '/consent-invite/view', '/consent-invite?token=secret'])
      expect(isConsentInvitationRoute(path)).toBe(false);
  });
});
