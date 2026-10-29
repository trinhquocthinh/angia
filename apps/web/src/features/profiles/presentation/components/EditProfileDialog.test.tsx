import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditProfileForm } from './EditProfileForm';
import { BirthYearReminder } from './BirthYearReminder';
const props = {
  birthYear: '2020',
  vitalsEnabled: false,
  currentYear: 2026,
  pending: false,
  error: null,
  yearError: null,
  onBirthYearChange: () => undefined,
  onVitalsChange: () => undefined,
  onSubmit: () => undefined,
  onClose: () => undefined,
};
describe('TC-449 — form sửa hồ sơ và dải nhắc', () => {
  it.each([
    ['2020', true],
    ['2011', true],
    ['2010', false],
    ['1980', false],
    ['', false],
    ['2027', false],
  ])('năm đang nhập %s hiển thị công tắc %s', (birthYear, visible) => {
    const html = renderToStaticMarkup(<EditProfileForm {...props} birthYear={birthYear} />);
    expect(html.includes('Theo dõi huyết áp, đường huyết')).toBe(visible);
    expect(html).toContain('name="birthYear"');
    expect(html).toContain('required=""');
    expect(html).not.toContain('name="displayName"');
  });
  it('khóa form lúc lưu và hiển thị lỗi năm sinh có liên kết truy cập', () => {
    const html = renderToStaticMarkup(
      <EditProfileForm {...props} pending yearError="Nhập năm sinh từ 1900 đến năm nay." />,
    );
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toContain('Đang lưu…');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="edit-year-error"');
  });
  it('dải nhắc có nút Bổ sung để mở cùng hộp thoại', () => {
    const html = renderToStaticMarkup(<BirthYearReminder onEdit={() => undefined} />);
    expect(html).toContain('Bổ sung năm sinh để AN GIA hiển thị đúng mục theo độ tuổi.');
    expect(html).toContain('type="button"');
    expect(html).toContain('Bổ sung</button>');
  });
});
