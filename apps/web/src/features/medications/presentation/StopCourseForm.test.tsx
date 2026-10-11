import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MedicationCourse } from '@angia/contracts';
import { StopCourseForm } from './StopCourseForm';
const course: MedicationCourse = {
  id: 'c',
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Canxi',
  strength: '500mg',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: '2026-10-08',
  status: 'active',
};
describe('Form dừng đợt thuốc', () => {
  it('TC-051: giới hạn ngày theo server/kỳ hạn, cho dừng cùng ngày bắt đầu', () => {
    const html = renderToStaticMarkup(
      <StopCourseForm
        course={course}
        today="2026-10-11"
        pending={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(html).toContain('Canxi');
    expect(html).toContain('500mg');
    expect(html).toContain('min="2026-10-01"');
    expect(html).toContain('max="2026-10-08"');
    expect(html).toContain('value="2026-10-08"');
    expect(html).toContain('type="date"');
    const longTerm = renderToStaticMarkup(
      <StopCourseForm
        course={{ ...course, endDate: null }}
        today="2026-10-11"
        pending={true}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(longTerm).toContain('max="2026-10-11"');
    expect(longTerm).toContain('disabled=""');
  });
});
