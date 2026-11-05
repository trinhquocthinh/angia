import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApprovedDocumentResponse, DocumentDeletionImpact, HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { asNeededItem, seedAsNeededDose } from '@src/shared/test/seedAsNeededDose.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('Ràng buộc DB và xóa theo chứng từ của nhật ký liều "Khi cần" (SPEC-047, BR-048)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const confirmedProfile = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 2020, displayName: 'Bé An' })
    ).json()) as HealthProfile;
    await confirmConsentByAttestation(t, main, profile.id);
    return { familyId, main, profile };
  };
  const count = async (sql: string, value: string) =>
    (await t.owner.query(`SELECT count(*)::int AS n FROM ${sql}`, [value])).rows[0].n as number;

  it('TC-498: CHECK DB chặn số lượng ngoài (0, 1000], đơn vị > 20 ký tự và khoảng cách trên dòng/đợt không phải "Khi cần"', async () => {
    const f = await confirmedProfile();
    const { doseId, courseId } = await seedAsNeededDose(t, f.main, f.profile.id);
    for (const [sql, value] of [
      ['UPDATE as_needed_doses SET quantity = 0 WHERE id = $1', doseId],
      ['UPDATE as_needed_doses SET quantity = 1000.001 WHERE id = $1', doseId],
      ["UPDATE as_needed_doses SET unit = repeat('x', 21) WHERE id = $1", doseId],
      ["UPDATE as_needed_doses SET unit = '' WHERE id = $1", doseId],
      ["UPDATE medication_courses SET user_interval_text = repeat('x', 101) WHERE id = $1", courseId],
      [
        "UPDATE medication_courses SET user_interval_text = 'cách 6 giờ', slots = ARRAY['morning'] WHERE id = $1",
        courseId,
      ],
      [
        "UPDATE prescription_items SET min_interval_text = 'cách 6 giờ', slots = ARRAY['morning'], quantity_per_dose = 1 WHERE id = (SELECT prescription_item_id FROM medication_courses WHERE id = $1)",
        courseId,
      ],
    ] as const) {
      await expect(t.owner.query(sql, [value]), sql).rejects.toThrow(/violates check constraint/);
    }
    await t.owner.query('UPDATE as_needed_doses SET quantity = 1000 WHERE id = $1', [doseId]);
  });

  it('TC-499: xóa chứng từ xóa nhật ký liều của đợt sinh từ đơn; deletion-impact đếm asNeededDoses', async () => {
    const f = await confirmedProfile();
    const prescription = {
      type: 'prescription',
      issuedDate: vietnamDate(-1),
      facility: null,
      diagnosis: null,
      items: [{ ...asNeededItem, minIntervalText: 'cách 4–6 giờ' }],
    };
    const owner = { familyId: f.familyId, profileId: f.profile.id, accountId: f.main.accountId };
    const { documentId } = await seedPendingDocument(t, owner, prescription);
    const approved = await t.call(f.main, 'POST', `/api/source-documents/${documentId}/approve`, {
      type: 'prescription',
      data: prescription,
    });
    expect(approved.status).toBe(200);
    const saved = (await approved.json()) as ApprovedDocumentResponse;
    expect(saved.prescription!.items[0]!.minIntervalText).toBe('cách 4–6 giờ');
    const courseId = (
      await t.owner.query('SELECT id FROM medication_courses WHERE prescription_item_id = $1', [
        saved.prescription!.items[0]!.id,
      ])
    ).rows[0].id as string;
    const doses = `/api/health-profiles/${f.profile.id}/as-needed-doses`;
    for (const minutes of [120, 60]) {
      const givenAt = new Date(Date.now() - minutes * 60_000).toISOString();
      expect((await t.call(f.main, 'POST', doses, { courseId, givenAt })).status).toBe(201);
    }
    // Liều của đợt khác (đơn nhập tay) không bị xóa theo.
    await seedAsNeededDose(t, f.main, f.profile.id, { ...asNeededItem, name: 'Ibuprofen' });

    const impact = await t.call(f.main, 'GET', `/api/source-documents/${documentId}/deletion-impact`);
    expect(((await impact.json()) as DocumentDeletionImpact).asNeededDoses).toBe(2);
    const removed = await t.call(f.main, 'DELETE', `/api/source-documents/${documentId}`, { confirm: 'XÓA' });
    expect(removed.status).toBe(204);
    expect(await count('as_needed_doses WHERE medication_course_id = $1', courseId)).toBe(0);
    expect(await count('as_needed_doses WHERE health_profile_id = $1', f.profile.id)).toBe(1);
  });
});
