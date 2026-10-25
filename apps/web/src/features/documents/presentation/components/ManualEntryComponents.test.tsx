import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ManualEntryForm } from './ManualEntryForm';

const props = { pending: false, error: null, onSubmit: () => undefined, intro: 'Nhập theo ảnh bên cạnh.' };

describe('Form nhập tay (SPEC-011, BR-016)', () => {
  it('chưa rõ loại chứng từ → chỉ hiện bộ chọn loại, chưa có form và nút Lưu', () => {
    const html = renderToStaticMarkup(<ManualEntryForm {...props} initialType={null} />);
    expect(html).toContain('Loại dữ liệu');
    for (const label of ['Đơn thuốc', 'Xét nghiệm', 'Máy đo cá nhân']) expect(html).toContain(label);
    expect(html).not.toContain('type="submit"');
  });

  it('điền sẵn loại đã khai báo và mở form trống tương ứng', () => {
    const html = renderToStaticMarkup(<ManualEntryForm {...props} initialType="prescription" />);
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*Đơn thuốc/);
    expect(html).toContain('id="issuedDate"');
    expect(html).toContain('type="submit"');
  });

  it('BR-016: không nhắc tới dữ liệu AI trích xuất khi nhập tay', () => {
    for (const type of ['prescription', 'lab_result', 'device_reading'] as const) {
      const html = renderToStaticMarkup(<ManualEntryForm {...props} initialType={type} />);
      expect(html).not.toContain('AI');
      expect(html).toContain('Nhập theo ảnh bên cạnh.');
    }
  });
});
