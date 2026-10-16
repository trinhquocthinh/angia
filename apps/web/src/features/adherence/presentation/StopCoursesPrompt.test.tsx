import type { MedicationCourse } from '@angia/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StopCoursesPrompt } from './StopCoursesPrompt';

const course: MedicationCourse = {
  id: 'c1',
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Dầu cá',
  strength: '1000mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: null,
  status: 'active',
};
const render = (props: Partial<Parameters<typeof StopCoursesPrompt>[0]> = {}) =>
  renderToStaticMarkup(
    <StopCoursesPrompt
      courses={[course]}
      stopDate="2026-10-16"
      pending={false}
      stopped={false}
      failed={false}
      onConfirm={() => undefined}
      onDismiss={() => undefined}
      {...props}
    />,
  );

describe('Hỏi dừng đợt thuốc sau khi ghi "Ngưng" thực tế (owner chốt 2026-10-16)', () => {
  it('liệt kê đợt còn trong danh mục, nói rõ ghi nhận thực tế không tự đổi danh mục, hỏi xác nhận', () => {
    const html = render();
    expect(html).toContain('Dầu cá 1000mg');
    expect(html).toContain('từ 01/10/2026 · Dài hạn');
    expect(html).toContain('Ghi nhận thực tế không tự thay đổi danh mục thuốc điều trị.');
    expect(html).toContain('Dừng luôn đợt thuốc này trong danh mục từ 16/10/2026?');
    expect(html).toContain('Dừng đợt thuốc');
    expect(html).toContain('Giữ nguyên danh mục');
  });

  it('đã dừng / lỗi: thông báo trung tính, không còn nút xác nhận', () => {
    const stopped = render({ stopped: true });
    expect(stopped).toContain('Đã dừng đợt thuốc trong danh mục từ 16/10/2026.');
    expect(stopped).not.toContain('Giữ nguyên danh mục');
    expect(render({ failed: true })).toContain('Không dừng được đợt thuốc.');
  });
});
