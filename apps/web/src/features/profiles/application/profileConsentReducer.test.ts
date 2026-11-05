import { describe, expect, it } from 'vitest';
import { profileConsentReducer, type ProfileConsentState } from './profileConsentReducer';
const state: ProfileConsentState = {
  displayName: 'Bé',
  accountId: '',
  draft: { checked: true, basis: 'self', respondentName: 'Bé' },
};
describe('TC-558 — không tái sử dụng cam kết khi đổi đối tượng', () => {
  it('đổi tài khoản xóa tick, tư cách và tên người đồng ý', () => {
    expect(profileConsentReducer(state, { type: 'account', value: 'other' })).toEqual({
      displayName: 'Bé',
      accountId: 'other',
      draft: { checked: false, basis: '', respondentName: '' },
    });
  });
  it('gợi ý tên chính người này theo tên hồ sơ, không đè tên đã sửa hoặc tên giám hộ', () => {
    expect(profileConsentReducer(state, { type: 'name', value: 'An' }).draft.respondentName).toBe('An');
    for (const draft of [
      { ...state.draft, respondentName: 'Tên khác' },
      { ...state.draft, basis: 'guardian' as const },
    ]) {
      expect(
        profileConsentReducer({ ...state, draft }, { type: 'name', value: 'An' }).draft.respondentName,
      ).toBe(draft.respondentName);
    }
  });
  it('đổi tư cách/chỉnh tên ghi lại đúng lựa chọn', () => {
    const value = { checked: true, basis: 'guardian', respondentName: 'Mẹ' } as const;
    expect(profileConsentReducer(state, { type: 'consent', value }).draft).toEqual(value);
  });
});
