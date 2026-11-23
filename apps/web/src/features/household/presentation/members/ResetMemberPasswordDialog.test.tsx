import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { ResetMemberPasswordDialog } from './ResetMemberPasswordDialog';

const effects: React.EffectCallback[] = [];
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useEffect: vi.fn((effect: React.EffectCallback) => {
    effects.push(effect);
  }),
}));

afterEach(() => {
  effects.length = 0;
  vi.clearAllMocks();
});

it('TC-756: hộp xác nhận hiện đúng 3 dòng SPEC-062, icon Stitch và không có phụ đề thừa', () => {
  const html = renderToStaticMarkup(
    <ResetMemberPasswordDialog
      displayName="Mẹ Hoa"
      pending={false}
      error={null}
      result={null}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(html).toContain('<dialog');
  expect(html).toContain('Đặt lại mật khẩu cho Mẹ Hoa?');
  expect(html).toContain('Mẹ Hoa sẽ bị đăng xuất khỏi mọi thiết bị.');
  expect(html).toContain('Mật khẩu tạm có hiệu lực 24 giờ.');
  expect(html).toContain('Mẹ Hoa phải đổi mật khẩu khi đăng nhập.');
  expect(html).toContain('Huỷ');
  expect(html).toContain('Đặt lại mật khẩu');
  expect(html).toContain('member-reset-lock.svg');
  expect(html).not.toContain('Xác nhận cấp mật khẩu tạm thời');
  expect(html).not.toContain('Biến thể');
  expect(html).not.toContain('Trạng thái');
});

it('SPEC-062: lỗi 429 trong hộp xác nhận hiện alert và không khoá cứng nút Đặt lại mật khẩu', () => {
  const html = renderToStaticMarkup(
    <ResetMemberPasswordDialog
      displayName="Mẹ Hoa"
      pending={false}
      error="Bạn thao tác quá nhanh, vui lòng thử lại sau."
      result={null}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(html).toContain('role="alert"');
  expect(html).toContain('Bạn thao tác quá nhanh, vui lòng thử lại sau.');
  expect(html).toContain('member-reset-alert-circle.svg');
  expect(html).not.toMatch(/class="[^"]*member-reset-confirm-btn[^"]*"[^>]*disabled/);
});

it('SPEC-062: đang gửi mới khoá nút Đặt lại mật khẩu và Huỷ', () => {
  const html = renderToStaticMarkup(
    <ResetMemberPasswordDialog
      displayName="Mẹ Hoa"
      pending={true}
      error={null}
      result={null}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('Đang đặt lại…');
  expect(html).toContain('disabled=""');
});

it('TC-756: hộp kết quả hiện mật khẩu đơn cách, nút Sao chép aria-live, hạn từ expiresAt và nút Xong', () => {
  const html = renderToStaticMarkup(
    <ResetMemberPasswordDialog
      displayName="Mẹ Hoa"
      pending={false}
      error={null}
      result={{ temporaryPassword: 'A9xPq2Lm7Rt4', expiresAt: '2026-11-24T04:30:00.000Z' }}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect(html).toContain('Mật khẩu tạm của Mẹ Hoa');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('<code');
  expect(html).toContain('A9xPq2Lm7Rt4');
  expect(html).toContain('Sao chép');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('role="status"');
  expect(html).toContain('Chỉ hiện một lần. Hết hạn lúc 11:30 ngày 24/11/2026.');
  expect(html).toContain('Xong');
  expect(html).toContain('member-reset-check-circle.svg');
  expect(html).toContain('member-reset-copy.svg');
  expect(html).toContain('member-reset-alert-circle.svg');
  expect(html).not.toContain('Mật khẩu một lần');
  expect(html).not.toContain('MẬT KHẨU MỘT LẦN');
  expect(html).not.toContain('Đã tạo thành công');
});
