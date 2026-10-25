import { describe, expect, it } from 'vitest';
import { readInvitationDraft } from './readInvitationDraft';
describe('TC-106 — Người nhận tự khai tên và tư cách đồng thuận', () => {
  it('không tự chọn tư cách hoặc gửi tên rỗng/quá dài', () => {
    expect(readInvitationDraft('An', null, 'accepted').errors.basis).toBeTruthy();
    expect(readInvitationDraft(' ', 'self', 'declined').errors.respondentName).toBeTruthy();
    expect(readInvitationDraft('a'.repeat(61), 'guardian', 'accepted').errors.respondentName).toBeTruthy();
  });
  it('trim tên và giữ nguyên quyết định từ chối', () => {
    expect(readInvitationDraft(' An ', 'guardian', 'declined').body).toEqual({
      respondentName: 'An',
      basis: 'guardian',
      decision: 'declined',
    });
  });
});
