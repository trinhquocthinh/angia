import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { emptyAdminAuditFilters } from '../../application/AdminAuditFilters';
import { AdminAuditFilterFields } from './AdminAuditFilterFields';
it('TC-841: lỗi mã và ngày có thông báo truy cập và liên kết tới ô nhập', () => {
  const html = renderToStaticMarkup(
    <AdminAuditFilterFields
      draft={{ ...emptyAdminAuditFilters, familyId: 'sai' }}
      errors={{ familyId: 'Mã không hợp lệ.', dates: 'Khoảng ngày không hợp lệ.' }}
      onChange={() => {}}
    />,
  );
  expect(html).toContain('Mã không hợp lệ.');
  expect(html).toContain('Khoảng ngày không hợp lệ.');
  expect(html.match(/role="status"/g)).toHaveLength(2);
  expect(html.match(/aria-describedby=/g)).toHaveLength(3);
  expect(html.match(/aria-invalid="true"/g)).toHaveLength(1);
});
