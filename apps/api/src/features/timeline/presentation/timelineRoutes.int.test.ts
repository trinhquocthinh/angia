import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { timelinePageSchema, type TimelinePage } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedTimelineData } from '@src/shared/test/seedTimelineData.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

describe('API dòng thời gian sáu nguồn (E13-S5-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  const setup = () => seedTimelineData(t);
  const read = async (f: Awaited<ReturnType<typeof setup>>, query = '') => {
    const response = await t.call(f.main, 'GET', `${f.path}${query}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return timelinePageSchema.parse(await response.json());
  };

  it('TC-503: đủ sáu loại, đúng thứ tự và dữ liệu; gộp phiếu/lịch hẹn trước phân trang', async () => {
    const f = await setup();
    const second = await f.add('2026-10-30', '2026-10-02');
    const group1 = await f.labs('2026-10-30T00:00:00.000001Z');
    const group2 = await f.labs('2026-10-30T00:00:00.000002Z');
    const m1 = await f.measure('09:00');
    const m2 = await f.measure('08:00');
    const m3 = await f.measure(null);
    const page = await read(f);
    expect([...new Set(page.items.map((e) => e.kind))].sort()).toEqual([
      'adherence_period',
      'course_stopped',
      'lab_result',
      'measurement',
      'prescription',
      'revisit',
    ]);
    expect(page.items.map((e) => e.id)).toEqual([
      m1,
      m2,
      expect.any(String),
      f.courseId,
      ...[group1, group2].sort(),
      m3,
      '2026-10-30',
      second,
      f.prescriptionId,
    ]);
    expect(page.items.find((e) => e.kind === 'revisit')?.data).toEqual({
      prescriptionIds: [f.prescriptionId, second],
    });
    for (const event of page.items.filter((e) => e.kind === 'lab_result'))
      expect(event.data.results).toHaveLength(2);
    expect(page.items.find((e) => e.id === f.prescriptionId)).toMatchObject({
      data: { itemCount: 1, diffSummary: null },
    });
    expect(page.items.find((e) => e.id === second)).toMatchObject({
      data: { diffSummary: { added: 0, removed: 1, changed: 0 } },
    });
    expect(page.nextCursor).toBeNull();
    expect((await read(f, '?limit=1')).items[0]!.id).toBe(m1);
    const cursor = Buffer.from(
      JSON.stringify({ date: '2026-10-30', time: null, kind: 'revisit', id: '2026-10-30' }),
    ).toString('base64url');
    expect((await read(f, `?limit=1&cursor=${cursor}`)).items[0]).toMatchObject({
      id: second,
      data: { diffSummary: { removed: 1 } },
    });
    // Một sự kiện mỗi trang buộc cursor đi qua mọi ranh giới kind và cả phiếu XN.
    const singles: TimelinePage['items'] = [];
    let next: string | null = null;
    do {
      const single = await read(f, `?limit=1${next ? `&cursor=${next}` : ''}`);
      singles.push(...single.items);
      next = single.nextCursor;
    } while (next && singles.length <= page.items.length);
    expect(next).toBeNull();
    expect(singles).toEqual(page.items);
  });

  it('TC-503: giữ giá trị đường huyết thập phân, đơn vị gốc và kiểu response hiện có', async () => {
    const f = await setup();
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO measurements
      (id,family_id,health_profile_id,kind,measured_on,measured_time,glucose_value,glucose_unit,manual_without_source)
      VALUES ($1,$2,$3,'blood_glucose','2026-10-30','07:30',5.7,'mmol/L',true)`,
      [id, f.familyId, f.profile.id],
    );
    expect((await read(f)).items.find((e) => e.id === id)).toMatchObject({
      kind: 'measurement',
      date: '2026-10-30',
      time: '07:30',
      data: { kind: 'glucose', glucoseValue: 5.7, glucoseUnit: 'mmol/L', sourceDocumentId: null },
    });
  });

  it('TC-503: loại dữ liệu từ chứng từ chưa duyệt, chỉ nhận nguồn approved', async () => {
    const f = await setup();
    const { documentId } = await seedPendingDocument(
      t,
      { familyId: f.familyId, profileId: f.profile.id, accountId: f.main.accountId },
      {},
    );
    const hidden = await f.measure('10:00', '2026-10-30', documentId);
    const hiddenPrescription = await f.add('2026-10-30', '2026-10-03', documentId);
    await f.labs('2026-10-30T01:00:00Z', documentId);
    let page = await read(f);
    const hiddenIds = new Set<string>([hidden, hiddenPrescription, documentId]);
    expect(page.items.some((e) => hiddenIds.has(e.id))).toBe(false);
    expect(page.items.find((e) => e.kind === 'revisit')?.data).toEqual({
      prescriptionIds: [f.prescriptionId],
    });
    await t.owner.query(
      "UPDATE source_documents SET status='approved', document_date='2026-10-30' WHERE id=$1",
      [documentId],
    );
    page = await read(f);
    expect(page.items.some((e) => e.id === hidden)).toBe(true);
    expect(page.items.find((e) => e.id === documentId)).toMatchObject({
      kind: 'lab_result',
      data: { results: expect.any(Array) },
    });
  });

  it('TC-504: 120 sự kiện nhiều khóa trùng, ba trang không trùng/sót, cursor còn dùng sau xóa', async () => {
    const f = await setup();
    const ids: string[] = [];
    for (let i = 0; i < 116; i++) ids.push(await f.measure(i < 55 ? '08:00' : null));
    const pages: TimelinePage[] = [];
    let cursor: string | null = null;
    do {
      const page = await read(f, `?limit=50${cursor ? `&cursor=${cursor}` : ''}`);
      pages.push(page);
      cursor = page.nextCursor;
    } while (cursor && pages.length < 4);
    expect(pages.map((p) => p.items.length)).toEqual([50, 50, 20]);
    const events = pages.flatMap((p) => p.items);
    expect(new Set(events.map((e) => `${e.kind}:${e.id}`)).size).toBe(120);
    expect(
      events
        .filter((e) => e.kind === 'measurement')
        .map((e) => e.id)
        .sort(),
    ).toEqual(ids.sort());
    const last = pages[0]!.items.at(-1)!;
    await t.owner.query('DELETE FROM measurements WHERE id=$1', [last.id]);
    expect(await read(f, `?limit=50&cursor=${pages[0]!.nextCursor}`)).toEqual(pages[1]);
  });

  it('TC-505: ẩn số đo trẻ em, bật lại vẫn giữ các loại khác', async () => {
    const f = await setup();
    await f.measure('08:00');
    await t.owner.query('UPDATE health_profiles SET birth_year=2020 WHERE id=$1', [f.profile.id]);
    expect((await read(f)).items.map((e) => e.kind)).not.toContain('measurement');
    await t.owner.query('UPDATE health_profiles SET vitals_enabled=true WHERE id=$1', [f.profile.id]);
    expect((await read(f)).items.map((e) => e.kind)).toContain('measurement');
  });

  it('TC-503: cách ly gia đình, quyền main, xác thực, đồng thuận và input', async () => {
    const f = await setup();
    const foreign = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(foreign, 'GET', f.path),
      () => t.call(foreign, 'GET', f.path.replace(f.profile.id, randomUUID())),
    );
    expect((await t.call(await t.session(f.familyId, 'member'), 'GET', f.path)).status).toBe(403);
    expect((await t.app.request(f.path)).status).toBe(401);
    for (const query of ['?limit=0', '?limit=101', '?limit=1.5', '?cursor=bad', '?cursor=', '?cursor=e30']) {
      const response = await t.call(f.main, 'GET', `${f.path}${query}`);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    for (const status of ['pending', 'invited', 'declined', 'withdrawn']) {
      await t.owner.query(
        "UPDATE health_profiles SET consent_status=$2,consent_withdrawn_at=CASE WHEN $2='withdrawn' THEN now() ELSE NULL END WHERE id=$1",
        [f.profile.id, status],
      );
      const response = await t.call(f.main, 'GET', f.path);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    }
  });
});
