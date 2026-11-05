import { describe, expect, it } from 'vitest';
import { createHealthProfileRequestSchema } from './profileRequests.js';

const attestation = { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: '  Mẹ  ' };
describe('Đồng thuận khi tạo hồ sơ LG-02', () => {
  it('TC-552: giữ cam kết và chuẩn hóa tên trim/NFC trước giới hạn độ dài', () => {
    expect(
      createHealthProfileRequestSchema.parse({ displayName: 'Bé', birthYear: 2020, consent: attestation }),
    ).toEqual({
      displayName: 'Bé',
      birthYear: 2020,
      consent: { ...attestation, respondentName: 'Mẹ' },
    });
    const consent = { ...attestation, respondentName: 'e\u0301'.repeat(60) };
    expect(
      createHealthProfileRequestSchema.safeParse({ displayName: 'Bé', birthYear: 2020, consent }).success,
    ).toBe(true);
  });
  it.each([
    { ...attestation, attestation: false },
    { ...attestation, attestation: 'true' },
    { ...attestation, basis: undefined },
    { ...attestation, basis: 'other' },
    { ...attestation, respondentName: '' },
    { ...attestation, respondentName: '  ' },
    { ...attestation, respondentName: 'a'.repeat(61) },
    { kind: 'unknown' },
    null,
  ])('TC-552: từ chối consent không hợp lệ %j', (consent) => {
    expect(
      createHealthProfileRequestSchema.safeParse({ displayName: 'Bé', birthYear: 2020, consent }).success,
    ).toBe(false);
  });
  it('TC-555: giữ lựa chọn tự xác nhận', () => {
    expect(
      createHealthProfileRequestSchema.parse({
        displayName: 'Tôi',
        birthYear: 1980,
        consent: { kind: 'self' },
      }),
    ).toEqual({
      displayName: 'Tôi',
      birthYear: 1980,
      consent: { kind: 'self' },
    });
  });
});
