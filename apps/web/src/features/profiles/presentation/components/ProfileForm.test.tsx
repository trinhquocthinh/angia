import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NewProfileForm } from './NewProfileForm';
import { ConsentChoices } from './ConsentChoices';
describe('Form tạo hồ sơ và lựa chọn đồng thuận rõ ràng', () => {
  it('hiển thị tài khoản có thể liên kết, không tự xác nhận', () => {
    const html = renderToStaticMarkup(
      <NewProfileForm
        accounts={[{ id: 'a', displayName: 'An' }]}
        accountsLoading={false}
        accountsError={false}
        retry={() => undefined}
        pending={false}
        onSave={async () => undefined}
      />,
    );
    expect(html).toContain('Không liên kết tài khoản');
    expect(html).toContain('An');
    expect(html).toContain('Hồ sơ mới chưa có đồng thuận');
  });
  it('khóa form và hiển thị đang lưu trong lúc gửi', () => {
    const html = renderToStaticMarkup(
      <NewProfileForm
        accounts={[]}
        accountsLoading={false}
        accountsError={false}
        retry={() => undefined}
        pending
        onSave={async () => undefined}
      />,
    );
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toContain('Đang lưu…');
  });
  it('không tự chọn tư cách xác nhận', () => {
    const html = renderToStaticMarkup(
      <ConsentChoices basis={null} pending={false} setBasis={() => undefined} />,
    );
    expect(html).toContain('Căn cứ đồng thuận');
    expect(html).toContain('Đối tượng của hồ sơ đã đồng thuận');
    expect(html).toContain('Người giám hộ hợp pháp đã đồng thuận');
    expect(html).not.toContain('Tôi là');
    expect(html).not.toContain('checked=""');
    expect(html.match(/type="radio"/g)).toHaveLength(2);
  });
});
