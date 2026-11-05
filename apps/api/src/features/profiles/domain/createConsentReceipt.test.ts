import { describe, expect, it } from 'vitest';
import { createConsentReceipt } from './createConsentReceipt.js';
import type { ConsentConfirmation } from './ConsentConfirmation.js';

const at = new Date('2026-10-27T00:00:00Z');
const actor = { id: 'main', displayName: '  Mẹ  ' };
const consent = {
  kind: 'attestation',
  attestation: true,
  basis: 'guardian',
  respondentName: '  Mẹ  ',
} as const;
describe('Bằng chứng đồng thuận LG-02', () => {
  it('TC-550: không yêu cầu receipt khi bỏ consent', () => {
    expect(createConsentReceipt(undefined, null, actor, at)).toEqual({ ok: true, value: null });
  });
  it('TC-549: chuẩn hóa cam kết và lưu đúng tư cách', () => {
    expect(createConsentReceipt(consent, null, actor, at)).toEqual({
      ok: true,
      value: {
        consentStatus: 'confirmed',
        consentSource: 'main_attested',
        consentConfirmedAt: at,
        consentConfirmedBy: 'main',
        consentBasis: 'guardian',
        consentRespondentName: 'Mẹ',
      },
    });
  });
  it('TC-555: self dùng tên tài khoản và tư cách self', () => {
    expect(createConsentReceipt({ kind: 'self' }, 'main', actor, at)).toMatchObject({
      ok: true,
      value: { consentSource: 'self', consentBasis: 'self', consentRespondentName: 'Mẹ' },
    });
  });
  it.each([
    { ...consent, attestation: false },
    { ...consent, basis: 'other' },
    { ...consent, respondentName: ' ' },
    { ...consent, respondentName: 'a'.repeat(61) },
    { kind: 'other' },
  ])('TC-552: không sinh receipt với dữ liệu sai %j', (input) => {
    expect(createConsentReceipt(input as ConsentConfirmation, null, actor, at)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
  it('TC-552: cam kết không dùng với tài khoản liên kết, self không dùng với người khác', () => {
    expect(createConsentReceipt(consent, 'main', actor, at)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    for (const id of [null, 'other'])
      expect(createConsentReceipt({ kind: 'self' }, id, actor, at)).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
    expect(createConsentReceipt({ kind: 'self' }, 'main', { ...actor, displayName: null }, at)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
});
