import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Prescription, PrescriptionDetail, PrescriptionListItem } from '@angia/contracts';
import { createRevisitFixture } from '@src/shared/test/createRevisitFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { manualPrescription } from '@src/shared/test/healthDataFixtures.js';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('Chuỗi đơn và chi tiết (SPEC-045)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  const setup = async () => {
    const f = await createRevisitFixture(t);
    const base = `${f.base}/prescriptions`;
    const add = async (issuedDate: string, strength: string, documentId?: string) => {
      const conflicts = await t.owner.query(
        "SELECT id FROM medication_courses WHERE health_profile_id=$1 AND status='active' AND start_date <= $2 AND (end_date IS NULL OR end_date >= $2)",
        [f.profile.id, issuedDate],
      );
      const data = {
        ...manualPrescription,
        issuedDate,
        items: [
          {
            ...manualPrescription.items[0]!,
            strength,
            durationDays: 7,
            resolution: 'parallel',
            expectedConflictCourseIds: conflicts.rows.map((r) => r.id as string),
          },
        ],
      };
      const response = documentId
        ? await t.call(f.main, 'POST', `/api/source-documents/${documentId}/approve`, {
            type: 'prescription',
            data,
            confirmDuplicate: true,
          })
        : await t.call(f.main, 'POST', `${f.base}/manual-records`, {
            type: 'prescription',
            data,
            confirmDuplicate: true,
          });
      expect(response.status).toBe(200);
      return ((await response.json()) as { prescription: Prescription }).prescription;
    };
    const get = async (id: string) => {
      const response = await t.call(f.main, 'GET', `${base}/${id}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      return (await response.json()) as PrescriptionDetail;
    };
    return { ...f, base, add, get };
  };

  it('TC-484: chuỗi theo ngày/thời điểm/ID, đầu-cuối, đủ dòng và mọi đợt dùng lại đã kết thúc', async () => {
    const f = await setup();
    const empty = await t.call(f.main, 'GET', f.base);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual([]);
    const last = await f.add('2026-03-01', '20mg');
    const second = await f.add('2026-02-01', '10mg');
    const first = await f.add('2026-02-01', '5mg');
    await t.owner.query('UPDATE prescriptions SET created_at=$2 WHERE id=$1', [
      first.id,
      '2026-02-01T00:00:00Z',
    ]);
    await t.owner.query('UPDATE prescriptions SET created_at=$2 WHERE id=$1', [
      second.id,
      '2026-02-02T00:00:00Z',
    ]);
    const listResponse = await t.call(f.main, 'GET', f.base);
    expect(listResponse.status).toBe(200);
    expect(listResponse.headers.get('cache-control')).toBe('no-store');
    const list = (await listResponse.json()) as PrescriptionListItem[];
    expect(list.map((p) => p.id)).toEqual([first.id, second.id, last.id]);
    expect(list[0]).toEqual({
      id: first.id,
      issuedDate: first.issuedDate,
      facility: first.facility,
      diagnosis: first.diagnosis,
      itemCount: 1,
      revisitDate: null,
      origin: 'manual',
    });
    const reuse = await t.call(f.main, 'POST', `${f.base}/${second.id}/reuse`, {
      startDate: '2026-04-01',
      items: [{ prescriptionItemId: second.items[0]!.id, durationDays: 7, longTerm: false }],
    });
    expect(reuse.status).toBe(201);
    await t.owner.query("UPDATE medication_courses SET status='ended' WHERE prescription_item_id=$1", [
      second.items[0]!.id,
    ]);
    expect(await f.get(first.id)).toMatchObject({ previousId: null, nextId: second.id, diff: null });
    const middle = await f.get(second.id);
    expect(middle).toMatchObject({
      prescription: { ...second, createdAt: '2026-02-02T00:00:00.000Z' },
      previousId: first.id,
      nextId: last.id,
      diff: {
        added: [],
        removed: [],
        changed: [
          { name: second.items[0]!.name, changes: [{ field: 'strength', before: '5mg', after: '10mg' }] },
        ],
      },
    });
    expect(middle.courses).toHaveLength(2);
    expect(
      middle.courses.every((c) => c.prescriptionItemId === second.items[0]!.id && c.status === 'ended'),
    ).toBe(true);
    expect(await f.get(last.id)).toMatchObject({ previousId: second.id, nextId: null });
    expect(await f.get(last.id.toUpperCase())).toMatchObject({ previousId: second.id, nextId: null });
    await t.owner.query('UPDATE prescriptions SET created_at=$2 WHERE id=$1', [
      second.id,
      '2026-02-01T00:00:00Z',
    ]);
    const tied = (await (await t.call(f.main, 'GET', f.base)).json()) as PrescriptionListItem[];
    expect(tied.map((p) => p.id)).toEqual([...[first.id, second.id].sort(), last.id]);
  });

  it('TC-485: xóa chứng từ giữa chuỗi tính lại liền trước, không còn đợt hoặc liên kết treo', async () => {
    const f = await setup();
    const first = await f.add('2026-01-01', '5mg');
    const { documentId } = await seedPendingDocument(
      t,
      {
        familyId: f.familyId,
        profileId: f.profile.id,
        accountId: f.main.accountId,
      },
      { type: 'prescription' },
    );
    const middle = await f.add('2026-02-01', '10mg', documentId);
    const last = await f.add('2026-03-01', '20mg');
    const list = (await (await t.call(f.main, 'GET', f.base)).json()) as PrescriptionListItem[];
    expect(list.find((p) => p.id === middle.id)?.origin).toBe('document');
    expect(await f.get(last.id)).toMatchObject({ previousId: middle.id });
    expect(
      (await t.call(f.main, 'DELETE', `/api/source-documents/${documentId}`, { confirm: 'XÓA' })).status,
    ).toBe(204);
    expect(await f.get(last.id)).toMatchObject({
      previousId: first.id,
      diff: { changed: [{ changes: [{ field: 'strength', before: '5mg', after: '20mg' }] }] },
    });
    expect(await f.get(first.id)).toMatchObject({ nextId: last.id });
    expect((await t.call(f.main, 'GET', `${f.base}/${middle.id}`)).status).toBe(404);
  });

  it('TC-484: chỉ main, cách ly gia đình/hồ sơ và kiểm consent ở cả hai API', async () => {
    const f = await setup();
    const p = await f.add('2026-01-01', '5mg');
    const member = await t.session(f.familyId, 'member');
    const foreign = await t.session(await t.family());
    for (const path of [f.base, `${f.base}/${p.id}`]) {
      expect((await t.call(member, 'GET', path)).status).toBe(403);
      expect((await t.app.request(path)).status).toBe(401);
      await expectCrossFamilyDenied(
        () => t.call(foreign, 'GET', path),
        () => t.call(foreign, 'GET', path.replace(f.profile.id, randomUUID())),
      );
    }
    const other = await t.call(f.main, 'POST', '/api/health-profiles', {
      displayName: 'Ba',
      birthYear: 1950,
    });
    const { id: otherId } = (await other.json()) as { id: string };
    // Cổng đồng thuận được kiểm trước khi đọc dữ liệu đơn.
    expect((await t.call(f.main, 'GET', `${f.base.replace(f.profile.id, otherId)}/${p.id}`)).status).toBe(
      409,
    );
    for (const status of ['pending', 'invited', 'declined', 'withdrawn']) {
      await t.owner.query(
        "UPDATE health_profiles SET consent_status=$2, consent_withdrawn_at=CASE WHEN $2='withdrawn' THEN now() ELSE NULL END WHERE id=$1",
        [f.profile.id, status],
      );
      for (const path of [f.base, `${f.base}/${p.id}`]) {
        const response = await t.call(f.main, 'GET', path);
        expect(response.status).toBe(409);
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
      }
    }
    await acceptConsentInvitation(t, f.main, otherId);
    expect((await t.call(f.main, 'GET', `${f.base.replace(f.profile.id, otherId)}/${p.id}`)).status).toBe(
      404,
    );
    expect((await t.call(f.main, 'GET', `${f.base}/not-a-uuid`)).status).toBe(422);
  });
});
