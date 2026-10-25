import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InvitationIdentityFields } from './InvitationIdentityFields';
import { InvitationContent } from './InvitationContent';
import { InvitationManagerBody } from './InvitationManagerBody';
import { InvitationTerminal } from './InvitationTerminal';
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
    expect(html).toContain('Tự nhập');
    expect(html).toContain('Đại diện xác nhận cho người thân (cha mẹ, con nhỏ, người được chăm sóc)');
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
    expect(html).toContain('nhận diện tự động ở nước ngoài');
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
  it('TC-376 hộp thoại tạo link có ô cam kết bắt buộc, ghi chú không còn SIT/Tailscale', () => {
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
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('Tôi xác nhận sẽ gửi link này cho chính người có tên trong hồ sơ');
    expect(html).toContain('Tôi không tự bấm thay.');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>(?:(?!<\/button>).)*Tạo link xác nhận/s);
    expect(html).not.toContain('SIT');
    expect(html).not.toContain('Tailscale');
  });
  it('TC-376 trang link nêu quyền của người nhận, không bắt buộc đồng ý, và terminal giữ chưa xác minh', () => {
    const view = {
      profileDisplayName: 'Mẹ',
      inviterDisplayName: null,
      expiresAt: '2026-10-13T00:00:00Z',
      status: 'pending' as const,
    };
    const html = renderToStaticMarkup(
      <InvitationContent
        workspace={{
          loaded: { state: 'ready', view },
          receipt: null,
          error: '',
          pending: false,
          respond: async () => undefined,
          retry: () => undefined,
        }}
      />,
    );
    expect(html).toContain('Người quản lý gia đình mời bạn đồng ý lưu thông tin sức khỏe');
    expect(html).toContain('Quyền của bạn:');
    expect(html).toContain('Bạn có quyền từ chối');
    expect(html).toContain('hãy chọn');
    expect(html).toContain('Từ chối');
    expect(html).not.toContain('**');
    const named = renderToStaticMarkup(
      <InvitationContent
        workspace={{
          loaded: { state: 'ready', view: { ...view, inviterDisplayName: 'Lan' } },
          receipt: null,
          error: '',
          pending: false,
          respond: async () => undefined,
          retry: () => undefined,
        }}
      />,
    );
    expect(named).toContain('Lan mời bạn đồng ý lưu');
    expect(renderToStaticMarkup(<InvitationTerminal status="accepted" receipt={null} />)).toContain(
      'chưa được xác minh',
    );
  });
});
