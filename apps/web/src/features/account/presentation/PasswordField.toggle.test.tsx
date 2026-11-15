import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { PasswordField } from './PasswordField';

// Bộ render phía máy chủ không phát sự kiện; giữ trạng thái local để gọi đúng handler của nút.
const state = vi.hoisted(() => ({ visible: false }));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useId: () => 'password',
  useState: () => [
    state.visible,
    (update: (previous: boolean) => boolean) => {
      state.visible = update(state.visible);
    },
  ],
}));
it('bật rồi tắt mật khẩu, đồng bộ type, tên và aria-pressed', () => {
  const render = () => PasswordField({ label: 'Mật khẩu', autoComplete: 'new-password' });
  const click = () => {
    const element = render() as React.ReactElement<{ children: React.ReactElement[] }>;
    const button = React.Children.toArray(element.props.children)[1] as React.ReactElement<{
      onClick: () => void;
    }>;
    button.props.onClick();
  };
  click();
  const visible = renderToStaticMarkup(render());
  expect(visible).toContain('type="text"');
  expect(visible).toContain('aria-label="Ẩn mật khẩu"');
  expect(visible).toContain('aria-pressed="true"');
  click();
  const hidden = renderToStaticMarkup(render());
  expect(hidden).toContain('type="password"');
  expect(hidden).toContain('aria-label="Hiện mật khẩu"');
  expect(hidden).toContain('aria-pressed="false"');
});
