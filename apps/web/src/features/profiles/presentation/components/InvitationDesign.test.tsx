import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InvitationIdentityFields } from './InvitationIdentityFields';
import { InvitationContent } from './InvitationContent';
import { InvitationManagerBody } from './InvitationManagerBody';
describe('TC-106 — thiết kế Stitch lời mời đồng thuận', () => {
  it('không chọn sẵn tư cách; mô tả giám hộ không gắn mặc định với tuổi cao', () => {
    const html = renderToStaticMarkup(
      <InvitationIdentityFields
        name=""
        basis={null}
        setName={() => undefined}
        setBasis={() => undefined}
        errors={{}}
      />,
    );
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).not.toContain('checked=""');
    expect(html).toContain('Tự khai');
    expect(html).toContain('Theo tư cách giám hộ hợp pháp của bạn');
    expect(html).not.toContain('người cao tuổi');
  });
  it('trang nhận không lộ tên gia đình hoặc giả định AI an toàn hay được hủy bất cứ lúc nào', () => {
    const html = renderToStaticMarkup(
      <InvitationContent
        workspace={{
          loaded: {
            state: 'ready',
            view: {
              profileDisplayName: 'Mẹ',
              inviterDisplayName: null,
              expiresAt: '2026-10-13T00:00:00Z',
              status: 'pending',
            },
          },
          receipt: null,
          error: '',
          pending: false,
          respond: async () => undefined,
          retry: () => undefined,
        }}
      />,
    );
    expect(html).toContain('Xác nhận quyền riêng tư');
    expect(html).toContain('AI ở nước ngoài');
    expect(html).toContain('chưa được xác minh');
    expect(html).not.toContain('Người gửi lời mời');
    expect(html).not.toContain('AN GIA Care');
    expect(html).not.toContain('bất cứ lúc nào');
  });
  it('ngăn quản lý có hồ sơ và footer đúng bảo đảm thực tế, không tuyên bố E2EE', () => {
    const html = renderToStaticMarkup(
      <InvitationManagerBody
        name="Mẹ"
        invitationState="none"
        created={null}
        pending={false}
        error={null}
        message=""
        create={async () => undefined}
        revoke={async () => undefined}
        close={() => undefined}
      />,
    );
    expect(html).toContain('Hồ sơ: Mẹ');
    expect(html).toContain('Danh tính người phản hồi chưa được xác minh');
    expect(html).not.toContain('E2EE');
    expect(html).not.toContain('Chữ ký số');
  });
});
