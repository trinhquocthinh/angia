import { describe, expect, it } from 'vitest';
import { createMemoryReminderRecipientRepository } from '@src/shared/test/createMemoryReminderRecipientRepository.js';
import { getReminderRecipients } from './getReminderRecipients.js';
import { setReminderRecipients } from './setReminderRecipients.js';

const request = { familyId: 'family-a', profileId: 'an', recipientAccountIds: ['dad', 'mom'] };
const parents = [
  { accountId: 'dad', displayName: 'Bố' },
  { accountId: 'mom', displayName: 'Mẹ' },
];

describe('TC-380: hồ sơ đã rút đồng thuận — đọc người nhận', () => {
  it('getReminderRecipients → ERR_CONSENT_REQUIRED, không đọc tài khoản hay người nhận', async () => {
    const m = createMemoryReminderRecipientRepository([
      { id: 'an', familyId: 'family-a', consentStatus: 'withdrawn' },
    ]);
    let reads = 0;
    const repository: typeof m.repository = {
      withFamily: (familyId, work) =>
        m.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            listFamilyAccounts: async () => {
              reads += 1;
              return store.listFamilyAccounts();
            },
            listRecipientIds: async (id) => {
              reads += 1;
              return store.listRecipientIds(id);
            },
          }),
        ),
    };
    expect(await getReminderRecipients(repository, 'family-a', 'an')).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(reads).toBe(0);
  });
});

describe('Chỉ định người nhận nhắc thuốc (SPEC-026)', () => {
  it('TC-069: hồ sơ "Bé An" lưu thành công 02 người nhận là cha và mẹ', async () => {
    const m = createMemoryReminderRecipientRepository();
    const expected = { mode: 'assigned', recipients: parents, candidates: parents };
    expect(await setReminderRecipients(m.repository, request)).toEqual({ ok: true, value: expected });
    expect(m.state.recipients.map((r) => r.accountId)).toEqual(['dad', 'mom']);
    expect(await getReminderRecipients(m.repository, 'family-a', 'an')).toEqual({
      ok: true,
      value: expected,
    });
  });
  it('TC-070: chỉ định tài khoản member trả ERR_VALIDATION, danh sách cũ giữ nguyên', async () => {
    const m = createMemoryReminderRecipientRepository();
    await setReminderRecipients(m.repository, request);
    const before = structuredClone(m.state.recipients);
    expect(
      await setReminderRecipients(m.repository, { ...request, recipientAccountIds: ['grandma'] }),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(m.state.recipients).toEqual(before);
  });
  it('lưu lại thay toàn bộ danh sách', async () => {
    const m = createMemoryReminderRecipientRepository();
    await setReminderRecipients(m.repository, request);
    await setReminderRecipients(m.repository, { ...request, recipientAccountIds: ['mom'] });
    expect(m.state.recipients.map((r) => r.accountId)).toEqual(['mom']);
  });
  it('hồ sơ liên kết: GET trả tài khoản liên kết, PUT trả ERR_VALIDATION', async () => {
    const m = createMemoryReminderRecipientRepository();
    const linked = { ...request, profileId: 'grandma-profile' };
    expect(await setReminderRecipients(m.repository, linked)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(await getReminderRecipients(m.repository, 'family-a', 'grandma-profile')).toMatchObject({
      ok: true,
      value: { mode: 'linked', recipients: [{ accountId: 'grandma', displayName: 'Bà' }] },
    });
    expect(m.state.recipients).toEqual([]);
  });
  it('gia đình khác trả ERR_NOT_FOUND, chưa đồng thuận trả ERR_CONSENT_REQUIRED, không ghi', async () => {
    const m = createMemoryReminderRecipientRepository([
      { id: 'an', familyId: 'family-a', consentStatus: 'pending' },
    ]);
    expect(await setReminderRecipients(m.repository, { ...request, familyId: 'family-b' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await getReminderRecipients(m.repository, 'family-b', 'an')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await setReminderRecipients(m.repository, request)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(m.state.recipients).toEqual([]);
  });
});
