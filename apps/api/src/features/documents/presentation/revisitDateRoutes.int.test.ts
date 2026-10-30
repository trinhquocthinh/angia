import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApprovedDocumentResponse, HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const prescription = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  revisitDate: '2026-10-31',
  facility: null,
  diagnosis: null,
  items: [
    {
      name: 'Thuốc A',
      strength: null,
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
  ],
};
type Flow = 'pending_review' | 'manual_entry' | 'direct';

describe('Ngày hẹn tái khám qua route thật (SPEC-043)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  async function fixture(flow: Flow, confirmed = true) {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', {
      displayName: 'Mẹ',
      birthYear: 1950,
    });
    const profile = (await created.json()) as HealthProfile;
    if (confirmed) await acceptConsentInvitation(t, main, profile.id);
    if (flow === 'direct')
      return { main, profile, path: `/api/health-profiles/${profile.id}/manual-records` };
    const { documentId } = await seedPendingDocument(
      t,
      { familyId, accountId: main.accountId, profileId: profile.id },
      prescription,
    );
    if (flow === 'manual_entry')
      await t.owner.query("UPDATE source_documents SET status = 'manual_entry' WHERE id = $1", [documentId]);
    return { main, profile, path: `/api/source-documents/${documentId}/approve` };
  }

  it.each<Flow>(['pending_review', 'manual_entry', 'direct'])(
    'TC-573: %s lưu và đọc lại đúng ngày hẹn',
    async (flow) => {
      const { main, profile, path } = await fixture(flow);
      if (flow === 'pending_review') {
        const review = await t.call(main, 'GET', path.replace('/approve', '/review'));
        expect(await review.json()).toMatchObject({ extraction: { revisitDate: '2026-10-31' } });
      }
      const response = await t.call(main, 'POST', path, { type: 'prescription', data: prescription });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ prescription: { revisitDate: '2026-10-31' } });
      const stored = await t.owner.query(
        'SELECT revisit_date::text FROM prescriptions WHERE health_profile_id = $1',
        [profile.id],
      );
      expect(stored.rows).toEqual([{ revisit_date: '2026-10-31' }]);
      const entries = await t.call(main, 'GET', `/api/health-profiles/${profile.id}/document-entries`);
      expect(await entries.json()).toMatchObject({
        items: [{ records: { prescription: { revisitDate: '2026-10-31' } } }],
      });
    },
  );

  it.each(['2026-09-30', '2036-09-29', '2026-02-30'])(
    'TC-472: ngày %s bị từ chối ở cả duyệt và nhập tay, không ghi dữ liệu',
    async (revisitDate) => {
      for (const flow of ['pending_review', 'direct'] as const) {
        const { main, profile, path } = await fixture(flow);
        const response = await t.call(main, 'POST', path, {
          type: 'prescription',
          data: { ...prescription, revisitDate },
        });
        expect(response.status).toBe(422);
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
        expect(
          (await t.owner.query('SELECT 1 FROM prescriptions WHERE health_profile_id = $1', [profile.id]))
            .rowCount,
        ).toBe(0);
        expect(
          (await t.owner.query('SELECT 1 FROM medication_courses WHERE health_profile_id = $1', [profile.id]))
            .rowCount,
        ).toBe(0);
      }
    },
  );

  it.each(['2026-10-01', '2036-09-28', null, undefined])(
    'TC-472/573: chấp nhận biên hoặc ngày trống %s, trả ngày hẹn rõ ràng',
    async (revisitDate) => {
      const { main, path } = await fixture('direct');
      const response = await t.call(main, 'POST', path, {
        type: 'prescription',
        data: { ...prescription, revisitDate },
      });
      expect(response.status).toBe(200);
      const body = (await response.json()) as ApprovedDocumentResponse;
      expect(body.prescription?.revisitDate).toBe(revisitDate ?? null);
    },
  );

  it('TC-573: các route ghi ngày hẹn cách ly gia đình, hồ sơ chưa đồng thuận bị chặn', async () => {
    for (const flow of ['pending_review', 'direct'] as const) {
      const { main, path } = await fixture(flow, false);
      const body = { type: 'prescription', data: prescription };
      const denied = await t.call(main, 'POST', path, body);
      expect(denied.status).toBe(409);
      expect(await denied.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
      const other = await t.session(await t.family());
      const missing = path.replace(/[0-9a-f-]{36}/, randomUUID());
      await expectCrossFamilyDenied(
        () => t.call(other, 'POST', path, body),
        () => t.call(other, 'POST', missing, body),
      );
    }
  });
});
