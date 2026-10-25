import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { createSelfReportedCourse } from './createSelfReportedCourse.js';
import type { MedicationRepository } from './ports.js';

const request = {
  familyId: 'family-a',
  profileId: 'me',
  name: ' Canxi ',
  strength: '500mg',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['morning'] as const,
  startDate: '2026-10-01',
};
const fixture = () => createMemoryReviewRepository([]);

describe('Khai báo thuốc bổ (SPEC-016)', () => {
  it('TC-049: lưu dài hạn trực tiếp, giữ hàm lượng, không tạo đơn thuốc', async () => {
    const m = fixture();
    expect(await createSelfReportedCourse(m.repository, request)).toMatchObject({
      ok: true,
      value: {
        name: 'Canxi',
        nameNormalized: 'canxi',
        strength: '500mg',
        source: 'self_reported',
        prescriptionItemId: null,
        startDate: '2026-10-01',
        endDate: null,
        status: 'active',
        quantityPerDose: 0.5,
      },
    });
    expect(m.medicationCourses).toHaveLength(1);
    expect(m.prescriptions).toEqual([]);
  });
  it.each([{ slots: [] }, { quantityPerDose: null }, { quantityPerDose: undefined }])(
    'TC-050: thiếu buổi hoặc liều thì không ghi đợt: %j',
    async (missing) => {
      const m = fixture();
      expect(await createSelfReportedCourse(m.repository, { ...request, ...missing })).toMatchObject({
        ok: false,
        code: 'ERR_DOSE_INFO_MISSING',
      });
      expect(m.medicationCourses).toEqual([]);
    },
  );
  it('TC-049: hồ sơ khác gia đình trả not found và không ghi', async () => {
    const m = fixture();
    expect(await createSelfReportedCourse(m.repository, { ...request, familyId: 'family-b' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(m.medicationCourses).toEqual([]);
  });
  it('TC-049: hồ sơ chưa đồng thuận bị chặn', async () => {
    const m = createMemoryReviewRepository([], {}, [
      { id: 'me', familyId: 'family-a', consentStatus: 'pending' },
    ]);
    expect(await createSelfReportedCourse(m.repository, request)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
  it('TC-049: thiếu hàm lượng lưu null; chưa chọn xử lý thì không thêm', async () => {
    const m = fixture();
    const without = { ...request, strength: undefined };
    await createSelfReportedCourse(m.repository, without);
    const result = await createSelfReportedCourse(m.repository, request);
    expect(result).toMatchObject({
      ok: false,
      code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
      conflicts: [{ itemIndexes: [0], courses: [{ strength: null }] }],
    });
    expect(m.medicationCourses).toHaveLength(1);
  });
  it.each(['replace', 'parallel'] as const)(
    'TC-049: %s xử lý toàn bộ đợt đã xác nhận',
    async (resolution) => {
      const m = fixture();
      await createSelfReportedCourse(m.repository, request);
      await createSelfReportedCourse(m.repository, {
        ...request,
        resolution: 'parallel',
        expectedConflictCourseIds: m.medicationCourses.map((c) => c.id),
      });
      const ids = m.medicationCourses.map((c) => c.id);
      const result = await createSelfReportedCourse(m.repository, {
        ...request,
        resolution,
        expectedConflictCourseIds: ids,
      });
      expect(result.ok).toBe(true);
      expect(m.medicationCourses).toHaveLength(3);
      expect(m.medicationCourses.slice(0, 2).map((c) => [c.status, c.endDate])).toEqual(
        resolution === 'replace'
          ? [
              ['replaced', '2026-09-30'],
              ['replaced', '2026-09-30'],
            ]
          : [
              ['active', null],
              ['active', null],
            ],
      );
    },
  );
  it('TC-049: thiếu ID xác nhận phải đối soát lại và không đóng đợt', async () => {
    const m = fixture();
    await createSelfReportedCourse(m.repository, request);
    expect(
      await createSelfReportedCourse(m.repository, {
        ...request,
        resolution: 'replace',
        expectedConflictCourseIds: [],
      }),
    ).toMatchObject({ code: 'ERR_COURSE_CONFLICT_UNRESOLVED' });
    expect(m.medicationCourses[0]!.status).toBe('active');
  });
  it('TC-049: lỗi ghi mới rollback cả đợt đã thay thế', async () => {
    const m = fixture();
    await createSelfReportedCourse(m.repository, request);
    const repository: MedicationRepository = {
      withFamily: (familyId, work) =>
        m.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            insertMedicationCourses: async () => {
              throw new Error('Lỗi ghi');
            },
          }),
        ),
    };
    await expect(
      createSelfReportedCourse(repository, {
        ...request,
        resolution: 'replace',
        expectedConflictCourseIds: [m.medicationCourses[0]!.id],
      }),
    ).rejects.toThrow('Lỗi ghi');
    expect(m.medicationCourses).toHaveLength(1);
    expect(m.medicationCourses[0]!.status).toBe('active');
  });
});
