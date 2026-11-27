import { expect, it } from 'vitest';
import { prepareRegistration } from './prepareRegistration';
const values = {
  username: 'me.lan',
  password: 'matkhau123',
  displayName: 'Lan',
  email: '',
  ageConfirmed: false,
  legalAgreed: true,
};
const legal = {
  terms: {
    id: 'terms',
    kind: 'terms' as const,
    version: '1',
    publishedAt: '2026-11-01T00:00:00Z',
    material: true,
    url: '/terms',
  },
  privacy: {
    id: 'privacy',
    kind: 'privacy' as const,
    version: '1',
    publishedAt: '2026-11-01T00:00:00Z',
    material: true,
    url: '/privacy',
  },
};
it('TC-736: dùng ID hiện hành, không gửi email rỗng, cờ đồng ý hay invitationToken', () => {
  expect(prepareRegistration(values, legal)).toEqual({
    username: 'me.lan',
    password: 'matkhau123',
    displayName: 'Lan',
    ageConfirmed: false,
    legalAcceptance: { termsVersionId: 'terms', privacyVersionId: 'privacy' },
  });
});
it.each([false, true])('TC-739: gửi nguyên giá trị xác nhận tuổi %s', (ageConfirmed) => {
  expect(prepareRegistration({ ...values, ageConfirmed, email: 'lan@email.com' }, legal)).toMatchObject({
    ageConfirmed,
    email: 'lan@email.com',
  });
});

it('SPEC-065: chỉ thêm invitationToken khi có lời mời chờ', () => {
  expect(prepareRegistration(values, legal, 'a'.repeat(43))).toEqual({
    ...prepareRegistration(values, legal),
    invitationToken: 'a'.repeat(43),
  });
  expect(prepareRegistration(values, legal)).not.toHaveProperty('invitationToken');
});
