import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DoseSlotSettingsForm } from './DoseSlotSettingsForm';

const render = (props: Partial<Parameters<typeof DoseSlotSettingsForm>[0]> = {}) =>
  renderToStaticMarkup(
    <DoseSlotSettingsForm
      saved={[]}
      pending={false}
      serverError={null}
      done={false}
      onSubmit={() => undefined}
      {...props}
    />,
  );

describe('Màn khung giờ buổi (SPEC-025)', () => {
  it('chưa thiết lập: báo trạng thái rỗng và 4 ô giờ Sáng/Trưa/Chiều/Tối', () => {
    const html = render();
    expect(html).toContain('Chưa thiết lập khung giờ nhắc.');
    expect(html.match(/type="time"/g)).toHaveLength(4);
    for (const label of ['Sáng', 'Trưa', 'Chiều', 'Tối']) expect(html).toContain(label);
  });
  it('TC-067: đã lưu thì điền sẵn giờ, không còn báo rỗng; lưu xong báo thành công', () => {
    const html = render({ saved: [{ slot: 'morning', time: '07:00' }], done: true });
    expect(html).toMatch(/name="morning" value="07:00"/);
    expect(html).not.toContain('Chưa thiết lập');
    expect(html).toContain('Đã lưu khung giờ nhắc.');
  });
  it('TC-068: lỗi từ API hiện trong vùng role=alert', () => {
    expect(render({ serverError: 'Dữ liệu không hợp lệ.' })).toMatch(
      /role="alert"[^>]*>Dữ liệu không hợp lệ\./,
    );
  });
});
