import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AccountMenuIcon } from './AccountMenuIcon';

it.each(['home', 'profile', 'settings', 'account-settings', 'logout'] as const)(
  'Menu: icon %s dùng asset 3D nội bộ, không có nhãn lặp',
  (name) => {
    const html = renderToStaticMarkup(<AccountMenuIcon name={name} />);
    expect(html).toContain(`/images/account-menu/${name === 'profile' ? 'profile-card' : name}-3d.png`);
    expect(html).toContain('alt=""');
    expect(html).toContain('width="40"');
  },
);
