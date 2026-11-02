import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreatedLinkDialog } from './CreatedLinkDialog';
import { InvitationManagerBody } from './InvitationManagerBody';
const created = { url: 'https://app/link-invite#token=v1.a', expiresAt: '2026-10-13T00:00:00Z' };
const body = (invitationState: 'none' | 'active' | 'uncertain', link: typeof created | null = null) =>
  renderToStaticMarkup(
    <InvitationManagerBody
      name="Mẹ"
      invitationState={invitationState}
      created={link}
      pending={false}
      error={null}
      message=""
      create={async () => undefined}
      revoke={async () => undefined}
      close={() => undefined}
    />,
  );
describe('SPEC-040 — main tạo và chia sẻ link liên kết', () => {
  it('nêu một lần, 7 ngày; main không tự xác nhận thay', () => {
    const html = body('uncertain');
    expect(html).toContain('Hồ sơ: Mẹ');
    expect(html).toContain('7 ngày');
    expect(html).toContain('Tạo link liên kết');
    expect(html).toContain('Thu hồi link đang chờ');
    expect(html).not.toContain('type="radio"');
    expect(html).not.toContain('Liên kết và đồng ý</button>');
  });
  it('link hiện đúng URL API trả về', () => {
    const html = body('active', created);
    expect(html).toContain('value="https://app/link-invite#token=v1.a"');
    expect(html).toContain('Sao chép link');
    expect(html).toContain('Tạo lại link');
  });
  it('sau khi thu hồi không còn nút thu hồi; chưa xác định thì không có link để sao chép', () => {
    expect(body('none')).not.toContain('Thu hồi');
    expect(body('uncertain')).not.toContain('invitation-link');
  });
});
describe('TC-576 — Tạo hồ sơ kèm tài khoản khác', () => {
  it('hiện link ngay sau khi tạo để gửi cho người đó', () => {
    const html = renderToStaticMarkup(<CreatedLinkDialog created={created} onClose={() => undefined} />);
    expect(html).toContain('Đã tạo hồ sơ');
    expect(html).toContain('value="https://app/link-invite#token=v1.a"');
  });
});
