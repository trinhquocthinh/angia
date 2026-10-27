import { describe, expect, it } from 'vitest';
import { readConsentDraft } from './readConsentDraft';
const draft = { checked: true, basis: 'guardian', respondentName: '  Mẹ  ' } as const;
describe('TC-558 — payload đồng thuận và điều kiện gửi', () => {
  it('chuẩn hóa tên NFC/trim và giữ đúng tư cách', () => {
    expect(readConsentDraft(draft, 'attestation')).toEqual({
      body: { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: 'Mẹ' },
      error: '',
    });
  });
  it.each(['attestation', 'self', 'invitation'] as const)('bỏ tick không gửi consent ở chế độ %s', (mode) => {
    expect(readConsentDraft({ ...draft, checked: false }, mode)).toEqual({ body: undefined, error: '' });
  });
  it('tự xác nhận chỉ gửi kind self; liên kết người khác không mang cam kết cũ', () => {
    expect(readConsentDraft(draft, 'self').body).toEqual({ kind: 'self' });
    expect(readConsentDraft(draft, 'invitation').body).toBeUndefined();
  });
  it.each(['', ' ', 'a'.repeat(61)])('chặn tên không hợp lệ %s', (respondentName) => {
    expect(readConsentDraft({ ...draft, respondentName }, 'attestation').body).toBeNull();
  });
  it('bắt buộc chọn tư cách, chấp nhận tên biên 60 ký tự', () => {
    expect(readConsentDraft({ ...draft, basis: '' }, 'attestation').body).toBeNull();
    expect(readConsentDraft({ ...draft, respondentName: 'a'.repeat(60) }, 'attestation').body).toMatchObject({
      respondentName: 'a'.repeat(60),
    });
  });
});
