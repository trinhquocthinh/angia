import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CurrentMedicationCourse } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { AsNeededDoseActions } from './AsNeededDoseActions';
import { AsNeededDoseForm } from './AsNeededDoseForm';
import { AsNeededDoseList } from './AsNeededDoseList';
import { CourseIntervalForm } from './CourseIntervalForm';

const course: CurrentMedicationCourse = {
  id: 'c',
  healthProfileId: 'p',
  prescriptionItemId: 'i',
  source: 'prescription',
  name: 'Thuốc minh họa',
  strength: '250mg',
  quantityPerDose: 2,
  doseUnit: 'viên',
  slots: ['as_needed'],
  startDate: '2026-11-01',
  endDate: null,
  status: 'active',
  prescriptionIssuedDate: '2026-11-01',
  lastDoseAt: null,
  interval: null,
};
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
const noop = () => undefined;
describe('Giao diện Khi cần', () => {
  it('TC-495/496: main ghi liều và nhập khoảng cách; nguồn đơn chỉ đọc', () => {
    const html = renderToStaticMarkup(<AsNeededDoseActions course={course} session={session} />);
    expect(html).toContain('Ghi liều');
    expect(html).toContain('Nhập khoảng cách');
    expect(html).toContain('Xem nhật ký');
    const prescription = renderToStaticMarkup(
      <AsNeededDoseActions
        course={{ ...course, interval: { text: 'nguyên văn', source: 'prescription' } }}
        session={session}
      />,
    );
    expect(prescription).not.toContain('Nhập khoảng cách');
    expect(prescription).not.toContain('Sửa khoảng cách');
  });
  it('TC-497: chỉ thuốc Khi cần có trong đơn có lối ghi liều', () => {
    for (const invalid of [
      { ...course, prescriptionItemId: null },
      { ...course, slots: ['morning'] as CurrentMedicationCourse['slots'] },
    ]) {
      expect(renderToStaticMarkup(<AsNeededDoseActions course={invalid} session={session} />)).toBe('');
    }
  });
  it('SPEC-042: tự xem chỉ có Xem nhật ký; không cấp quyền ghi cho member', () => {
    const html = renderToStaticMarkup(
      <AsNeededDoseActions course={course} session={{ ...session, role: 'member' }} readOnly />,
    );
    expect(html).toContain('Xem nhật ký');
    expect(html).not.toMatch(/Ghi liều|Nhập khoảng cách|Sửa khoảng cách/);
    expect(
      renderToStaticMarkup(<AsNeededDoseActions course={course} session={{ ...session, role: 'member' }} />),
    ).not.toContain('Ghi liều');
  });
  it('TC-498: form số lượng/đơn vị trống, giờ Việt Nam rõ ràng; khóa Lưu khi gửi', () => {
    const html = renderToStaticMarkup(
      <AsNeededDoseForm course={course} pending error={null} onSubmit={noop} onCancel={noop} />,
    );
    expect(html).toContain('giờ Việt Nam');
    expect(html).toContain('fieldset disabled');
    expect(html).not.toContain('value="2"');
    expect(html).not.toContain('value="viên"');
  });
  it('TC-496: khoảng cách tự nhập có giới hạn và cho xóa giá trị', () => {
    const html = renderToStaticMarkup(
      <CourseIntervalForm
        initialText="theo nhãn"
        pending={false}
        error={null}
        onSubmit={noop}
        onCancel={noop}
      />,
    );
    expect(html).toContain('maxLength="100"');
    expect(html).toContain('theo nhãn');
    expect(html).toContain('Để trống để xóa');
  });
  it('TC-499: nhật ký giữ ba số lẻ, tự xem không có nút xóa; pending khóa nút', () => {
    const doses = [
      {
        id: 'd',
        courseId: 'c',
        givenAt: '2026-11-03T17:30:00Z',
        quantity: 0.125,
        unit: 'ml',
        recordedBy: null,
        recordedAt: '2026-11-04T07:00:00Z',
      },
    ];
    const html = renderToStaticMarkup(<AsNeededDoseList doses={doses} pending={false} />);
    expect(html).toContain('0,125 ml');
    expect(html).toContain('00:30 · 04/11/2026');
    expect(html).not.toContain('Xóa bản ghi');
    const main = renderToStaticMarkup(<AsNeededDoseList doses={doses} pending onRemove={noop} />);
    expect(main).toContain('Xóa bản ghi');
    expect(main).toContain('disabled');
  });
});
