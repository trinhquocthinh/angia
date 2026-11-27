import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { AdminAuditEvent } from '../../application/ports';
import { AdminAuditEventRow } from './AdminAuditEventRow';
const id = '12345678-1234-4234-8234-123456789abc';
const event: AdminAuditEvent = {
  id,
  occurredAt: '2026-11-26T18:04:59.123456Z',
  actorAccountId: id,
  familyId: id,
  targetAccountId: id,
  targetProfileId: id,
  action: 'email_changed',
  metadata: { secret: 'NEVER_RENDER' },
};
it('TC-841: giờ VN, nhãn, id rút gọn với title; không hiện metadata', () => {
  const html = renderToStaticMarkup(<AdminAuditEventRow event={event} />);
  for (const text of [
    '27/11/2026 01:04',
    'Tài khoản 12345678',
    'Nhà 12345678',
    'Đối tượng: tài khoản 12345678',
    'hồ sơ 12345678',
    'Đổi email',
    `title="${id}"`,
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('NEVER_RENDER');
});
it('TC-841: tác nhân hệ thống và đối tượng trống', () => {
  const html = renderToStaticMarkup(
    <AdminAuditEventRow
      event={{
        ...event,
        actorAccountId: 'system_admin',
        familyId: null,
        targetAccountId: null,
        targetProfileId: null,
      }}
    />,
  );
  expect(html).toContain('Quản trị hệ thống');
  expect(html).not.toContain('Nhà ');
  expect(html).not.toContain('Đối tượng:');
});
