import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentMedicationCourse } from '@angia/contracts';
import { MedicationCatalog } from './MedicationCatalog';
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: unknown }) => children }));
const course: CurrentMedicationCourse = {
  id: 'a',
  healthProfileId: 'p',
  prescriptionItemId: 'item',
  source: 'prescription',
  name: 'Amlodipin',
  strength: '5mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: '2026-10-30',
  status: 'active',
  prescriptionIssuedDate: '2026-10-01',
};
const supplement: CurrentMedicationCourse = {
  ...course,
  id: 'b',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Canxi',
  strength: null,
  quantityPerDose: 0.5,
  slots: ['morning', 'evening'],
  endDate: null,
  prescriptionIssuedDate: null,
};
const render = (props: Partial<Parameters<typeof MedicationCatalog>[0]> = {}) =>
  renderToStaticMarkup(
    <MedicationCatalog
      data={{ today: '2026-10-13', courses: [course, supplement] }}
      loading={false}
      error={false}
      retry={() => undefined}
      {...props}
    />,
  );
describe('Danh mục thuốc theo buổi (Design §6, E4-S4-T1)', () => {
  it('TC-239: nhóm Sáng/Tối, nhãn "Còn N ngày"/"Dài hạn", liều và nguồn gốc', () => {
    const html = render();
    expect(html.indexOf('>Sáng<')).toBeLessThan(html.indexOf('>Tối<'));
    expect(html).not.toContain('>Trưa<');
    expect(html).toContain('Còn 18 ngày');
    expect(html).toContain('Dài hạn');
    expect(html).toContain('Mỗi lần 0,5 viên');
    expect(html).toContain('Đơn 01/10/2026');
    expect(html).toContain('Tự khai');
    expect(html.match(/Canxi/g)).toHaveLength(2);
  });
  it('TC-240: trạng thái rỗng chuẩn với đúng một hành động', () => {
    const html = render({ data: { today: '2026-10-13', courses: [] } });
    expect(html).toContain('Chưa có thuốc. Hãy tải đơn thuốc hoặc thêm thuốc bổ, vitamin.');
    expect(html).toContain('Tải ảnh đơn thuốc');
  });
  it('TC-240: khung xương khi tải và thẻ lỗi có Thử lại', () => {
    expect(render({ loading: true, data: undefined })).toContain('Đang tải danh mục thuốc');
    const error = render({ error: true, data: undefined });
    expect(error).toContain('role="alert"');
    expect(error).toContain('Thử lại');
  });
  it('TC-239: không có lời nhận định tốt/xấu/bất thường (BR-033)', () => {
    expect(render()).not.toMatch(/tốt|xấu|bất thường|nên /i);
  });
});
