import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReminderRecipientsForm } from './ReminderRecipientsForm';

const dad = { accountId: '00000000-0000-4000-8000-000000000001', displayName: 'Bố' };
const mom = { accountId: '00000000-0000-4000-8000-000000000002', displayName: 'Mẹ' };
const render = (props: Partial<Parameters<typeof ReminderRecipientsForm>[0]> = {}) =>
  renderToStaticMarkup(
    <ReminderRecipientsForm
      saved={{ mode: 'assigned', recipients: [], candidates: [dad, mom] }}
      pending={false}
      serverError={null}
      done={false}
      onSubmit={() => undefined}
      {...props}
    />,
  );

describe('Màn người nhận nhắc (SPEC-026)', () => {
  it('chưa chỉ định: báo trạng thái rỗng và liệt kê tài khoản main để chọn', () => {
    const html = render();
    expect(html).toContain('Chưa chỉ định người nhận nhắc.');
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).toContain('Bố');
    expect(html).toContain('Mẹ');
  });
  it('TC-069: đã chỉ định thì đánh dấu sẵn; lưu xong báo thành công', () => {
    const html = render({
      saved: { mode: 'assigned', recipients: [dad, mom], candidates: [dad, mom] },
      done: true,
    });
    expect(html.match(/checked=""/g)).toHaveLength(2);
    expect(html).not.toContain('Chưa chỉ định');
    expect(html).toContain('Đã lưu người nhận nhắc.');
  });
  it('TC-070: lỗi từ API hiện trong vùng role=alert', () => {
    expect(render({ serverError: 'Dữ liệu không hợp lệ.' })).toMatch(
      /role="alert"[^>]*>Dữ liệu không hợp lệ\./,
    );
  });
  it('hồ sơ liên kết tài khoản: chỉ hiện người nhận cố định, không có ô chọn', () => {
    const html = render({ saved: { mode: 'linked', recipients: [mom], candidates: [dad, mom] } });
    expect(html).toContain('tài khoản liên kết');
    expect(html).toContain('Mẹ');
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain('type="submit"');
  });
});
