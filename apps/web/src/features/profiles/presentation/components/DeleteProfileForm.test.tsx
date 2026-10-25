import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeleteProfileForm } from './DeleteProfileForm';
const base = {
  name: 'Mẹ',
  value: '',
  pending: false,
  mismatch: false,
  failure: null as string | null,
  onChange: () => undefined,
  onSubmit: () => undefined,
  onCancel: () => undefined,
};
const render = (props: Partial<typeof base> = {}) =>
  renderToStaticMarkup(<DeleteProfileForm {...base} {...props} />);
const submitButton = (html: string) =>
  html.match(/<button[^>]*type="submit"[^>]*>[^<]*<\/button>/)?.[0] ?? '';

describe('SPEC-007 — sheet xóa hồ sơ (09 Xóa hồ sơ v0.1b)', () => {
  it('cảnh báo xóa vĩnh viễn, ô nhập lại tên và nút xóa bị vô hiệu khi ô trống', () => {
    const html = render();
    expect(html).toContain('Xóa hồ sơ Mẹ');
    expect(html).toContain('xóa vĩnh viễn và không thể khôi phục');
    expect(html).toContain('Nhập lại chính xác tên hồ sơ');
    expect(html).toMatch(/autocomplete="off"/i);
    expect(submitButton(html)).toContain('disabled=""');
    expect(submitButton(html)).toContain('Xóa hồ sơ');
    expect(html).toContain('Hủy');
  });
  it('có tên thì bật nút; đang gửi thì đổi chữ và vô hiệu', () => {
    expect(submitButton(render({ value: 'Mẹ' }))).not.toContain('disabled=""');
    const pending = submitButton(render({ value: 'Mẹ', pending: true }));
    expect(pending).toContain('Đang xóa triệt để...');
    expect(pending).toContain('disabled=""');
  });
  it('tên không khớp và lỗi khác hiện thông báo role="alert"', () => {
    expect(render({ value: 'me', mismatch: true })).toMatch(/role="alert"[^>]*>Tên nhập lại không khớp</);
    expect(render({ value: 'Mẹ', failure: 'Không xóa được hồ sơ.' })).toMatch(
      /role="alert"[^>]*>Không xóa được hồ sơ.</,
    );
  });
});
