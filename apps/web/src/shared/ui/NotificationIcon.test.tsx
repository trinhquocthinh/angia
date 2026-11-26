import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { NotificationIcon } from './NotificationIcon';

it('Thông báo: chuông 3D trang trí, không chứa bộ đếm giả', () => {
  const html = renderToStaticMarkup(<NotificationIcon />);
  expect(html).toContain('/images/account-menu/notification-bell-3d.png');
  expect(html).toContain('alt=""');
  expect(html).not.toContain('+1');
});
