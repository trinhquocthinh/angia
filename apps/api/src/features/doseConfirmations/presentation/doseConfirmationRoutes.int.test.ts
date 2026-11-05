import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DoseConfirmation, MyReminder } from '@angia/contracts';
import { createDoseConfirmationRepository } from '../infrastructure/createDoseConfirmationRepository.js';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { seedReminder } from '@src/shared/test/seedReminder.js';
import {
  createDoseConfirmationFixture,
  createNamedProfile,
} from '@src/shared/test/createDoseConfirmationFixture.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const today = vietnamDate(0);
const path = (reminderId: string) => `/api/reminders/${reminderId}/dose-confirmation`;

describe('Xác nhận "Đã dùng" (SPEC-046, E14-S4-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  const createProfile = (main: SeededSession, displayName: string) =>
    createNamedProfile(t, main, displayName);
  const fixture = () => createDoseConfirmationFixture(t);
  const rows = async (profileId: string) =>
    (
      await t.owner.query<{
        reminder_id: string | null;
        confirmed_by_account_id: string;
        confirmed_by_name: string;
      }>('SELECT * FROM dose_confirmations WHERE health_profile_id=$1', [profileId])
    ).rows;

  it('TC-486: tài khoản liên kết xác nhận; GET lời nhắc có confirmation và canUndo', async () => {
    const f = await fixture();
    const response = await t.call(f.linked, 'POST', path(f.motherReminder), {});
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as DoseConfirmation;
    expect(body).toMatchObject({
      reminderId: f.motherReminder,
      profileId: f.motherProfile.id,
      date: today,
      slot: 'morning',
      confirmedBy: { accountId: f.linked.accountId, displayName: 'Bà M' },
    });
    expect((await rows(f.motherProfile.id))[0]).toMatchObject({
      reminder_id: f.motherReminder,
      confirmed_by_name: 'Bà M',
    });
    const read = (await (
      await t.call(f.linked, 'GET', `/api/me/reminders/${f.motherReminder}`)
    ).json()) as MyReminder;
    expect(read).toMatchObject({ confirmation: body, canConfirm: false, canUndo: true });
  });

  it('TC-487: main không được chỉ định xác nhận thay trên hồ sơ liên kết', async () => {
    const f = await fixture();
    const response = await t.call(f.mainMother, 'POST', path(f.motherReminder), {});
    expect(response.status).toBe(200);
    expect(((await response.json()) as DoseConfirmation).confirmedBy.accountId).toBe(f.mainMother.accountId);
  });

  it('TC-488: hồ sơ không liên kết chỉ người nhận được xác nhận, người khác 404 như không tồn tại', async () => {
    const f = await fixture();
    await expectCrossFamilyDenied(
      () => t.call(f.mainMother, 'POST', path(f.childReminder), {}),
      () => t.call(f.mainMother, 'POST', path(randomUUID()), {}),
    );
    await expectCrossFamilyDenied(
      () => t.call(f.otherMember, 'POST', path(f.childReminder), {}),
      () => t.call(f.otherMember, 'POST', path(randomUUID()), {}),
    );
    expect(await rows(f.childProfile.id)).toEqual([]);
    expect((await t.call(f.father, 'POST', path(f.childReminder), {})).status).toBe(200);
  });

  it('TC-489: lời nhắc hôm qua và ngày mai từ chối cả xác nhận lẫn hủy', async () => {
    const f = await fixture();
    for (const date of [vietnamDate(-1), vietnamDate(1)]) {
      const reminderId = await f.reminderOn(f.motherProfile.id, date);
      expect((await t.call(f.linked, 'POST', path(reminderId), {})).status).toBe(422);
      expect((await t.call(f.linked, 'DELETE', path(reminderId))).status).toBe(422);
    }
    expect(await rows(f.motherProfile.id)).toEqual([]);
  });

  it('TC-490: bấm lặp trả bản đầu, không ghi đè', async () => {
    const f = await fixture();
    const first = await (await t.call(f.linked, 'POST', path(f.motherReminder), {})).json();
    const repeat = await t.call(f.father, 'POST', path(f.motherReminder), {});
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toEqual(first);
  });

  it('TC-490: người đến sau chờ người ghi trước rồi nhận bản đó, đúng một dòng', async () => {
    const f = await fixture();
    let commit = () => undefined as void;
    let written = () => undefined as void;
    const canCommit = new Promise<void>((resolve) => (commit = resolve));
    const wrote = new Promise<void>((resolve) => (written = resolve));
    const first = createDoseConfirmationRepository(t.database).withFamily(f.familyId, async (store) => {
      const reminder = await store.lockReminder(f.motherReminder);
      await store.insert(reminder!, f.linked.accountId, 'Bà M', new Date());
      written();
      await canCommit;
    });
    await wrote;
    const late = t.call(f.father, 'POST', path(f.motherReminder), {});
    await new Promise((resolve) => setTimeout(resolve, 200));
    commit();
    await first;
    const response = await late;
    expect(response.status).toBe(200);
    expect(((await response.json()) as DoseConfirmation).confirmedBy.accountId).toBe(f.linked.accountId);
    expect(await rows(f.motherProfile.id)).toHaveLength(1);
  });

  it('TC-491: người đã xác nhận và main hủy được, member khác 404', async () => {
    const f = await fixture();
    await t.call(f.linked, 'POST', path(f.motherReminder), {});
    await expectCrossFamilyDenied(
      () => t.call(f.otherMember, 'DELETE', path(f.motherReminder)),
      () => t.call(f.otherMember, 'DELETE', path(randomUUID())),
    );
    expect(await rows(f.motherProfile.id)).toHaveLength(1);
    expect((await t.call(f.linked, 'DELETE', path(f.motherReminder))).status).toBe(204);
    expect(await rows(f.motherProfile.id)).toEqual([]);
    await t.call(f.linked, 'POST', path(f.motherReminder), {});
    expect((await t.call(f.mainMother, 'DELETE', path(f.motherReminder))).status).toBe(204);
    expect(await rows(f.motherProfile.id)).toEqual([]);
  });

  it('TC-492: xóa chứng từ giữ lời nhắc snapshot và bản xác nhận, không đếm; lời nhắc bị xóa thì reminder_id null; xóa hồ sơ thì xóa', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = await createProfile(main, 'Mẹ');
    await confirmConsentByAttestation(t, main, profile.id);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const { documentId } = await seedPendingDocument(t, owner, {
      type: 'prescription',
      issuedDate: today,
      facility: null,
      diagnosis: null,
      items: [],
    });
    const reminderId = await seedReminder(t.owner, familyId, profile.id, main.accountId, today);
    expect((await t.call(main, 'POST', path(reminderId), {})).status).toBe(200);

    const impact = await t.call(main, 'GET', `/api/source-documents/${documentId}/deletion-impact`);
    expect(await impact.text()).not.toMatch(/confirmation/i);
    const deleted = await t.call(main, 'DELETE', `/api/source-documents/${documentId}`, { confirm: 'XÓA' });
    expect(deleted.status).toBe(204);
    expect(await rows(profile.id)).toEqual([expect.objectContaining({ reminder_id: reminderId })]);

    await t.owner.query('DELETE FROM reminders WHERE id=$1', [reminderId]);
    expect(await rows(profile.id)).toEqual([
      expect.objectContaining({ reminder_id: null, confirmed_by_name: 'Người chăm' }),
    ]);
    await t.owner.query('DELETE FROM health_profiles WHERE id=$1', [profile.id]);
    expect(await rows(profile.id)).toEqual([]);
  });

  it('TC-494: hồ sơ đã rút đồng thuận từ chối xác nhận và hủy', async () => {
    const f = await fixture();
    await t.call(f.linked, 'POST', path(f.motherReminder), {});
    expect((await t.call(f.linked, 'POST', '/api/me/consent/withdraw', {})).status).toBe(200);
    for (const [method, body] of [
      ['POST', {}],
      ['DELETE', undefined],
    ] as const) {
      const response = await t.call(f.linked, method, path(f.motherReminder), body);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
    expect(await rows(f.motherProfile.id)).toHaveLength(1);
  });

  it('Body có trường thừa và thiếu CSRF bị từ chối', async () => {
    const f = await fixture();
    expect((await t.call(f.linked, 'POST', path(f.motherReminder), { x: 1 })).status).toBe(422);
    const noCsrf = await t.app.request(path(f.motherReminder), {
      method: 'POST',
      headers: { cookie: f.linked.cookie, 'content-type': 'application/json' },
      body: '{}',
    });
    expect(noCsrf.status).toBe(403);
    expect(await rows(f.motherProfile.id)).toEqual([]);
  });
});
