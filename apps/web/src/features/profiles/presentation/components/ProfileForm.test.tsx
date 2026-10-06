import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NewProfileForm } from './NewProfileForm';
import { InvitationResponseForm } from './InvitationResponseForm';
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
      <InvitationResponseForm pending={false} onRespond={async () => undefined} />,
    );
    expect(html).toContain('Tư cách của bạn');
    expect(html).toContain('Tôi là người có hồ sơ');
    expect(html).toContain('Tôi là người giám hộ hợp pháp');
    expect(html).not.toContain('checked=""');
    expect(html.match(/type="radio"/g)).toHaveLength(2);
  });
});
