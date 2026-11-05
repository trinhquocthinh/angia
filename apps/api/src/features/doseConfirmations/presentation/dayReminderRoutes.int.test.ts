import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SelfReminder } from '@angia/contracts';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { createDoseConfirmationFixture } from '@src/shared/test/createDoseConfirmationFixture.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const path = (reminderId: string) => `/api/reminders/${reminderId}/dose-confirmation`;

describe('Danh sách lời nhắc của ngày kèm xác nhận (SPEC-046, SPEC-042)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  const fixture = () => createDoseConfirmationFixture(t);

  const list = (profileId: string, query = '') => `/api/health-profiles/${profileId}/reminders${query}`;
  it('main thấy bản xác nhận; quyền theo API: không được chỉ định thì không có canConfirm', async () => {
    const f = await fixture();
    await t.call(f.linked, 'POST', path(f.motherReminder), {});
    const response = await t.call(f.mainMother, 'GET', list(f.motherProfile.id));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const [mother] = (await response.json()) as SelfReminder[];
    expect(mother).toMatchObject({
      id: f.motherReminder,
      confirmation: { confirmedBy: { accountId: f.linked.accountId } },
      canConfirm: false,
      canUndo: true,
    });
    const child = (await (
      await t.call(f.mainMother, 'GET', list(f.childProfile.id))
    ).json()) as SelfReminder[];
    expect(child[0]).toMatchObject({ confirmation: null, canConfirm: false, canUndo: false });
    const assigned = (await (
      await t.call(f.father, 'GET', list(f.childProfile.id))
    ).json()) as SelfReminder[];
    expect(assigned[0]).toMatchObject({ confirmation: null, canConfirm: true, canUndo: false });
  });
  it('Ngày cũ chỉ đọc; lọc đúng ngày; member 403; hồ sơ rút đồng thuận 409', async () => {
    const f = await fixture();
    const old = vietnamDate(-1);
    const oldId = await f.reminderOn(f.motherProfile.id, old);
    const past = (await (
      await t.call(f.father, 'GET', list(f.motherProfile.id, `?date=${old}`))
    ).json()) as SelfReminder[];
    expect(past).toMatchObject([{ id: oldId, canConfirm: false, canUndo: false }]);
    expect((await t.call(f.father, 'GET', list(f.motherProfile.id, '?date=abc'))).status).toBe(422);
    expect((await t.call(f.linked, 'GET', list(f.motherProfile.id))).status).toBe(403);
    await t.call(f.linked, 'POST', '/api/me/consent/withdraw', {});
    expect((await t.call(f.father, 'GET', list(f.motherProfile.id))).status).toBe(409);
  });
  it('Tự xem phản ánh cùng bản xác nhận, kể cả khi main ghi thay', async () => {
    const f = await fixture();
    const before = (await (
      await t.call(f.linked, 'GET', '/api/me/profile/reminders')
    ).json()) as SelfReminder[];
    expect(before).toMatchObject([{ confirmation: null, canConfirm: true, canUndo: false }]);
    await t.call(f.father, 'POST', path(f.motherReminder), {});
    const after = (await (
      await t.call(f.linked, 'GET', '/api/me/profile/reminders')
    ).json()) as SelfReminder[];
    expect(after).toMatchObject([
      {
        confirmation: { confirmedBy: { accountId: f.father.accountId, displayName: 'Cha' } },
        canConfirm: false,
        canUndo: false,
      },
    ]);
  });
});
