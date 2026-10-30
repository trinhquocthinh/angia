import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseConflictNotice } from './CourseConflictNotice';
import type { CourseConflictPrompt } from '../application/courseConflictPrompt';

const prompt: CourseConflictPrompt = {
  request: {
    type: 'prescription',
    data: {
      type: 'prescription',
      issuedDate: '2026-10-01',
      revisitDate: null,
      facility: null,
      diagnosis: null,
      items: [
        {
          name: 'Amlodipin',
          strength: '10mg',
          quantityPerDose: 1,
          externalUse: false,
          doseUnit: 'viên',
          slots: ['evening'],
          durationDays: 30,
          longTerm: false,
          note: null,
          totalQuantity: null,
        },
      ],
    },
  },
  conflicts: [
    {
      itemIndexes: [0],
      nameNormalized: 'amlodipin',
      courses: [
        {
          id: 'old-1',
          name: 'Amlodipin',
          strength: '5mg',
          quantityPerDose: 1,
          doseUnit: 'viên',
          slots: ['morning'],
          startDate: '2026-09-01',
          endDate: null,
        },
        {
          id: 'old-2',
          name: 'Amlodipin',
          strength: '2,5mg',
          quantityPerDose: 0.5,
          doseUnit: 'viên',
          slots: ['evening'],
          startDate: '2026-09-15',
          endDate: '2026-10-15',
        },
      ],
    },
  ],
};
describe('Xác nhận thuốc trùng tên', () => {
  it('TC-046: liệt kê tất cả đợt, không chọn sẵn và chặn lưu khi chưa chọn', () => {
    const html = renderToStaticMarkup(
      <CourseConflictNotice
        prompt={prompt}
        pending={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(html).toContain('<dialog');
    expect(html).toContain('aria-labelledby="course-conflict-title"');
    expect(html).not.toMatch(/Khuyên dùng|Cân nhắc/);
    expect(html).toContain('5mg');
    expect(html).toContain('2,5mg');
    expect(html).toContain('2026-09-01');
    expect(html).toContain('2026-09-15');
    expect(html).toContain('Thay thế');
    expect(html).toContain('Dùng song song');
    expect(html).not.toContain('checked=""');
    expect(html).toMatch(/disabled=""[^>]*>Lưu với lựa chọn này/);
    expect(html).toContain('Sửa lại đơn');
  });
});
