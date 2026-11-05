import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { useLinkInvitation } from '../../application/useLinkInvitation';
import type { InvitationReceipt, InvitationView } from '../../application/invitationPorts';
import { ConsentInvitePage } from '../ConsentInvitePage';
import { InvitationContent } from './InvitationContent';
import { InvitationExpiry } from './InvitationExpiry';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));
const view: InvitationView = {
  profileName: 'Mẹ',
  inviterName: null,
  expiresAt: '2026-10-13T00:00:00Z',
  canAccept: true,
  reason: null,
  consentNote: null,
};
type Workspace = ReturnType<typeof useLinkInvitation>;
const render = (loaded: Workspace['loaded'], receipt: InvitationReceipt | null = null) =>
  renderToStaticMarkup(
    <InvitationContent
      accountName="Lan"
      workspace={{
        loaded,
        receipt,
        error: '',
        pending: false,
        respond: async () => undefined,
        retry: () => undefined,
      }}
    />,
  );
const decode = (html: string) => html.replaceAll('&quot;', '"');
describe('TC-559 — Trang /link-invite', () => {
  it('nói rõ tài khoản đang đăng nhập trước hai nút quyết định', () => {
    const html = decode(render({ state: 'ready', view }));
    expect(html).toContain('Bạn đang đăng nhập là');
    expect(html).toContain('Lan');
    expect(html).toContain('Hồ sơ "Mẹ" sẽ gắn với tài khoản này.');
    expect(html).toContain('Liên kết và đồng ý');
    expect(html).toContain('Không đồng ý');
    expect(html).toContain('nhận diện tự động ở nước ngoài');
    expect(html).toContain('Quyền của bạn:');
  });
  it('thiếu token sau đăng nhập: yêu cầu mở lại link, không gọi là link hỏng', () => {
    const html = render({ state: 'missing' });
    expect(html).toContain('Hãy mở lại link');
    expect(html).toContain('Lan');
    expect(html).not.toContain('Liên kết và đồng ý');
  });
  it('link sai/hết hạn: thông báo chung, không có nút', () => {
    const html = render({ state: 'unavailable' });
    expect(html).toContain('Link không còn khả dụng');
    expect(html).not.toContain('<button');
  });
  it.each([
    ['account_already_linked', 'đã liên kết với một hồ sơ khác'],
    ['profile_already_linked', 'đã có tài khoản liên kết'],
  ] as const)('%s: không có nút quyết định', (reason, text) => {
    const html = render({ state: 'ready', view: { ...view, canAccept: false, reason } });
    expect(html).toContain(text);
    expect(html).not.toContain('<button');
  });
  it('từng rút đồng thuận: giải thích trước khi đồng ý lại', () => {
    const html = render({ state: 'ready', view: { ...view, consentNote: 'withdrawn_before' } });
    expect(html).toContain('từng bị rút đồng thuận');
  });
  it('biên nhận phân biệt đã liên kết và không đồng ý, không cho quyết định lại', () => {
    const receipt: InvitationReceipt = {
      outcome: 'linked',
      profileId: 'p',
      profileName: 'Mẹ',
      consentStatus: 'confirmed',
    };
    const linked = decode(render({ state: 'ready', view }, receipt));
    expect(linked).toContain('Hồ sơ "Mẹ" đã gắn với tài khoản của bạn.');
    expect(linked).not.toContain('<button');
    const declined = decode(
      render({ state: 'ready', view }, { ...receipt, outcome: 'declined', consentStatus: 'withdrawn' }),
    );
    expect(declined).toContain('không gắn với tài khoản của bạn');
  });
  it('hạn dùng hiển thị giờ Việt Nam', () => {
    const html = renderToStaticMarkup(<InvitationExpiry expiresAt="2026-10-12T17:00:00Z" />);
    expect(html).toContain('00:00');
    expect(html).toContain('13/10/26');
  });
});
describe('TC-577 — Trang link đồng thuận cũ', () => {
  it('báo ngừng dùng, không còn form phản hồi', () => {
    const html = renderToStaticMarkup(<ConsentInvitePage />);
    expect(html).toContain('Link này không còn dùng. Hãy nhờ người quản lý gia đình gửi link liên kết mới.');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<input');
  });
});
