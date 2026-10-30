import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { createManualRecords } from '../application/createManualRecords.js';
import { createReviewRepository } from '../infrastructure/createReviewRepository.js';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { duplicateConcurrencyPayloads as payloads } from '@src/shared/test/duplicateConcurrencyPayloads.js';
import { holdDuplicateRecordLock } from '@src/shared/test/holdDuplicateRecordLock.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const date = '2026-10-01';
type Payload = (typeof payloads)[number];
type Mode = 'approve' | 'manual' | 'mixed';

describe('SPEC-012: kiểm trùng đồng thời (E13-S2-T1, nợ #23)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  async function fixture(data: Payload, existingFamilyId?: string) {
    const familyId = existingFamilyId ?? (await t.family());
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', {
      birthYear: 1950,
      displayName: 'Mẹ',
    });
    const profile = (await created.json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const ids = [
      (await seedPendingDocument(t, owner, data)).documentId,
      (await seedPendingDocument(t, owner, data)).documentId,
    ];
    const manualPath = `/api/health-profiles/${profile.id}/manual-records`;
    const approve = async (index: number, confirmDuplicate = false) =>
      t.call(main, 'POST', `/api/source-documents/${ids[index]}/approve`, {
        type: data.type,
        data,
        confirmDuplicate,
      });
    const manual = async (confirmDuplicate = false) =>
      t.call(main, 'POST', manualPath, { type: data.type, data, confirmDuplicate });
    const key = `angia:duplicates:${familyId}:${profile.id}:${data.type}:${date}`;
    const count = async () =>
      (
        await t.owner.query(
          `SELECT (SELECT count(*) FROM prescriptions WHERE health_profile_id=$1)::int AS prescriptions,
       (SELECT count(*) FROM lab_results WHERE health_profile_id=$1)::int AS labs,
       (SELECT count(*) FROM measurements WHERE health_profile_id=$1)::int AS measurements`,
          [profile.id],
        )
      ).rows[0];
    return { familyId, main, profile, ids, key, manualPath, approve, manual, count };
  }

  async function race(f: Awaited<ReturnType<typeof fixture>>, mode: Mode) {
    const release = await holdDuplicateRecordLock(t, f.familyId, f.key);
    const calls: Promise<Response>[] = [];
    try {
      calls.push(mode === 'manual' ? f.manual() : f.approve(0));
      calls.push(mode === 'approve' ? f.approve(1) : f.manual());
      // DB riêng cho suite: cả hai request phải đang chờ khóa, không dùng sleep để đoán thứ tự.
      await expect
        .poll(
          async () =>
            (
              await t.owner.query(
                "SELECT count(*)::int AS waiting FROM pg_locks WHERE locktype='advisory' AND NOT granted",
              )
            ).rows[0].waiting,
          { timeout: 3000 },
        )
        .toBe(2);
      expect(await f.count()).toEqual({ prescriptions: 0, labs: 0, measurements: 0 });
    } finally {
      await release();
      await Promise.allSettled(calls);
    }
    return Promise.all(calls);
  }

  for (const data of payloads) {
    it.each<Mode>(['approve', 'manual', 'mixed'])(
      `${data.type}: hai lệnh %s chỉ lưu một bản`,
      async (mode) => {
        const f = await fixture(data);
        const responses = await race(f, mode);
        expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
        expect(await responses.find((r) => r.status === 409)!.json()).toMatchObject({
          error: { code: 'ERR_DUPLICATE_UNCONFIRMED' },
        });
        const field =
          data.type === 'prescription'
            ? 'prescriptions'
            : data.type === 'lab_result'
              ? 'labs'
              : 'measurements';
        expect(await f.count()).toEqual({ prescriptions: 0, labs: 0, measurements: 0, [field]: 1 });
        if (mode === 'approve') {
          const states = await t.owner.query('SELECT status FROM source_documents WHERE id=ANY($1)', [f.ids]);
          expect(states.rows.map((r) => r.status).sort()).toEqual(['approved', 'pending_review']);
        }
      },
    );
  }

  it('TC-039: nhả khóa sau commit và cho phép xác nhận lưu trùng', async () => {
    const f = await fixture(payloads[0]!);
    await race(f, 'mixed');
    expect((await f.manual(true)).status).toBe(200);
    expect(await f.count()).toEqual({ prescriptions: 0, labs: 2, measurements: 0 });
  });

  it('UUID viết hoa và viết thường cùng hồ sơ phải dùng chung khóa', async () => {
    const data = payloads[0]!;
    const f = await fixture(data);
    const manual = async () =>
      t.call(f.main, 'POST', `/api/health-profiles/${f.profile.id.toUpperCase()}/manual-records`, {
        type: data.type,
        data,
      });
    const responses = await race({ ...f, manual }, 'mixed');
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await responses.find((r) => r.status === 409)!.json()).toMatchObject({
      error: { code: 'ERR_DUPLICATE_UNCONFIRMED' },
    });
    expect(await f.count()).toEqual({ prescriptions: 0, labs: 1, measurements: 0 });
  });

  it('nhập tay theo ảnh cũng chỉ lưu một bản khi duyệt đồng thời', async () => {
    const f = await fixture(payloads[0]!);
    await t.owner.query("UPDATE source_documents SET status='manual_entry', type=NULL WHERE id=ANY($1)", [
      f.ids,
    ]);
    const responses = await race(f, 'approve');
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const states = await t.owner.query('SELECT status FROM source_documents WHERE id=ANY($1)', [f.ids]);
    expect(states.rows.map((r) => r.status).sort()).toEqual(['approved', 'manual_entry']);
  });

  it('rollback hủy bản ghi và nhả khóa để lệnh tiếp theo lưu được', async () => {
    const f = await fixture(payloads[0]!);
    const repository = createReviewRepository(t.database);
    await expect(
      createManualRecords(
        {
          withFamily: (familyId, work) =>
            repository.withFamily(familyId, async (store) => {
              await work(store);
              throw new Error('Lỗi sau ghi xét nghiệm');
            }),
        },
        {
          familyId: f.familyId,
          profileId: f.profile.id,
          type: 'lab_result',
          data: {
            type: 'lab_result',
            resultDate: date,
            facility: null,
            items: [{ testName: 'HbA1c', value: '7.2', unit: null, referenceRange: null }],
          },
        },
      ),
    ).rejects.toThrow('Lỗi sau ghi xét nghiệm');
    expect(await f.count()).toEqual({ prescriptions: 0, labs: 0, measurements: 0 });
    expect((await f.manual()).status).toBe(200);
  });

  it('khóa chỉ chặn cùng gia đình, hồ sơ, loại và ngày', async () => {
    const f = await fixture(payloads[0]!);
    const other = await fixture(payloads[0]!);
    const sameFamily = await fixture(payloads[0]!, f.familyId);
    const release = await holdDuplicateRecordLock(t, f.familyId, f.key);
    const done: Response[] = [];
    const calls = [
      other.manual(),
      sameFamily.manual(),
      t.call(f.main, 'POST', f.manualPath, { type: 'device_reading', data: payloads[1]! }),
      t.call(f.main, 'POST', f.manualPath, {
        type: 'lab_result',
        data: { ...payloads[0]!, resultDate: '2026-10-02' },
      }),
    ].map((call) =>
      Promise.resolve(call).then((response) => {
        done.push(response);
        return response;
      }),
    );
    try {
      await expect.poll(() => done.length, { timeout: 3000 }).toBe(4);
      expect(done.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    } finally {
      await release();
      await Promise.allSettled(calls);
    }
  });

  it('TC-040: chặn duyệt và nhập trực tiếp qua gia đình khác', async () => {
    const data = payloads[0]!;
    const f = await fixture(data);
    const other = await t.session(await t.family());
    const body = { type: data.type, data };
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', f.manualPath, body),
      () => t.call(other, 'POST', `/api/health-profiles/${randomUUID()}/manual-records`, body),
    );
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/source-documents/${f.ids[0]}/approve`, body),
      () => t.call(other, 'POST', `/api/source-documents/${randomUUID()}/approve`, body),
    );
    expect(await f.count()).toEqual({ prescriptions: 0, labs: 0, measurements: 0 });
  });
});
