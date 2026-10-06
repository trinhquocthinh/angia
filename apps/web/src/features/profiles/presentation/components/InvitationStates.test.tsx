import { InvitationExpiry } from './InvitationExpiry';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InvitationManagerBody } from './InvitationManagerBody';
import { InvitationTerminal } from './InvitationTerminal';
import { invitationReceiptMessage } from '../invitationReceiptMessage';
const receipt = {
  outcome: 'recorded' as const,
  decision: 'accepted' as const,
  respondentName: 'An',
  basis: 'self' as const,
  respondedAt: '2026-10-06T00:00:00Z',
};
describe('TC-106 — UI main và phản hồi người nhận', () => {
  it('main không tự chọn tư cách hay xác nhận thay, mô tả 7 ngày/SIT/Tailscale', () => {
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
    expect(html).toContain('7 ngày');
    expect(html).toContain('SIT/Tailscale');
    expect(html).not.toContain('type="radio"');
    expect(html).not.toContain('Thu hồi link chờ');
    expect(html).not.toContain('Tạo lại link');
  });
  it('trạng thái không xác định cho phép thử thu hồi nhưng không có link để sao chép', () => {
    const html = renderToStaticMarkup(
      <InvitationManagerBody
        name="Mẹ"
        invitationState="uncertain"
        created={null}
        pending={false}
        error={new Error('Mạng gián đoạn')}
        message="Không sử dụng link cũ"
        create={async () => undefined}
        revoke={async () => undefined}
        close={() => undefined}
      />,
    );
    expect(html).toContain('Thu hồi link chờ phản hồi');
    expect(html).not.toContain('invitation-link');
    expect(html).not.toContain('Sao chép link');
  });
  it('TC-100/101 — phân biệt đồng ý/từ chối và không lặp lại ghi nhận', () => {
    expect(invitationReceiptMessage(receipt)).toBe('Đã ghi nhận sự đồng ý của bạn.');
    expect(invitationReceiptMessage({ ...receipt, decision: 'declined' })).toBe(
      'Đã ghi nhận quyết định từ chối của bạn.',
    );
    expect(invitationReceiptMessage({ ...receipt, outcome: 'already_responded' })).toContain(
      'Phản hồi của bạn không được ghi thêm',
    );
    const html = renderToStaticMarkup(<InvitationTerminal status="declined" receipt={null} />);
    expect(html).toContain('Lời mời đã bị từ chối');
    expect(html).not.toContain('<button');
    expect(html).toContain('chưa được xác minh');
  });
  it('hạn dùng hiển thị giờ Việt Nam, không dùng múi giờ thiết bị', () => {
    const html = renderToStaticMarkup(<InvitationExpiry expiresAt="2026-10-12T17:00:00Z" />);
    expect(html).toContain('Hạn dùng');
    expect(html).toContain('00:00');
    expect(html).toContain('13/10/26');
    expect(html).toContain('giờ Việt Nam');
  });
});
