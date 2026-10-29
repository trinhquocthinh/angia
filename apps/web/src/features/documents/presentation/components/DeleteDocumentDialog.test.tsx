import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

const impact = {
  prescriptions: 2,
  prescriptionItems: 5,
  labResults: 0,
  measurements: 3,
  medicationCourses: 4,
  activeMedicationCourses: 2,
};
const render = (value: string, busy = false, data: typeof impact | null = impact) =>
  renderToStaticMarkup(
    <DeleteDocumentDialog
      impact={data}
      value={value}
      busy={busy}
      error={null}
      onChange={() => undefined}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      onRetry={() => undefined}
    />,
  );
describe('TC-436 xác nhận xóa chứng từ', () => {
  it('chỉ bật nút khi gõ chính xác XÓA, có tác động và không bận', () => {
    const disabled = (html: string) => /<button[^>]*disabled=""[^>]*>Xóa vĩnh viễn<\/button>/.test(html);
    for (const value of ['', 'xoa', 'XOA', 'xóa', ' XÓA', 'XÓA ']) expect(disabled(render(value))).toBe(true);
    expect(disabled(render('XÓA'))).toBe(false);
    expect(render('XÓA', true)).toMatch(/<button[^>]*disabled=""[^>]*>Đang xóa…<\/button>/);
    expect(disabled(render('XÓA', false, null))).toBe(true);
  });
  it('liệt kê số khác 0, kể cả đợt đang dùng; cảnh báo không khôi phục', () => {
    const html = render('');
    for (const text of [
      '2 đơn thuốc',
      '5 dòng thuốc',
      '3 số đo',
      '4 đợt thuốc, trong đó 2 đợt đang dùng',
      'Không thể khôi phục',
    ])
      expect(html).toContain(text);
    expect(html).not.toContain('0 kết quả xét nghiệm');
    expect(html).toContain('role="alertdialog"');
  });
  it('tác động bằng 0 vẫn cho xóa; thiếu tác động có lỗi thì cho thử lại', () => {
    const empty = Object.fromEntries(Object.keys(impact).map((name) => [name, 0])) as typeof impact;
    const html = renderToStaticMarkup(
      <DeleteDocumentDialog
        impact={empty}
        value="XÓA"
        busy={false}
        error={null}
        onChange={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onRetry={() => undefined}
      />,
    );
    expect(html).toContain('Ảnh và bản trích xuất của chứng từ sẽ bị xóa.');
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Xóa vĩnh viễn/);
    const failed = renderToStaticMarkup(
      <DeleteDocumentDialog
        impact={null}
        value="XÓA"
        busy={false}
        error="Không tải được tác động."
        onChange={() => undefined}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onRetry={() => undefined}
      />,
    );
    expect(failed).toContain('Không tải được tác động.');
    expect(failed).toContain('Thử lại');
  });
});
