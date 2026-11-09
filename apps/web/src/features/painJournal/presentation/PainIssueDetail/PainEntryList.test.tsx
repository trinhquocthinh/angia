import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PainEntryList } from './PainEntryList';
import { PainStatusHistory } from './PainStatusHistory';
import { issue } from '../../test/painIssues.test-helper';
const mother = { accountId: 'm', displayName: 'M' };
const main = { accountId: 'a', displayName: 'Thịnh' };
const first = {
  id: 'first',
  level: 6,
  recordedAt: issue.updatedAt,
  note: 'Lần cũ',
  createdBy: mother,
  updatedBy: main,
  updatedAt: issue.updatedAt,
};
it('TC-726 — hiện người ghi/sửa, tài khoản đã xóa, giờ Việt Nam và mới nhất trước', () => {
  const html = renderToStaticMarkup(
    <PainEntryList
      entries={[
        first,
        {
          ...first,
          id: 'second',
          recordedAt: '2026-11-07T03:00:00Z',
          note: 'Lần mới',
          createdBy: null,
          updatedBy: null,
        },
      ]}
      onEdit={() => undefined}
    />,
  );
  expect(html).toContain('Ghi bởi M · sửa bởi Thịnh');
  expect(html).toContain('Ghi bởi Tài khoản đã xóa');
  expect(html).toContain('07/11/2026 · 01:30');
  expect(html.indexOf('Lần mới')).toBeLessThan(html.indexOf('Lần cũ'));
  expect(html.match(/<button/g)).toHaveLength(2);
});
it('lịch sử dùng ngày sự kiện và người ghi, rỗng thì ẩn', () => {
  expect(renderToStaticMarkup(<PainStatusHistory events={[]} />)).toBe('');
  const html = renderToStaticMarkup(
    <PainStatusHistory
      events={[
        { kind: 'resolved', on: '2026-11-06', by: main, at: issue.updatedAt },
        { kind: 'reopened', on: '2026-11-07', by: null, at: issue.updatedAt },
      ]}
    />,
  );
  expect(html).toContain('Đã khỏi · 06/11/2026 · Ghi bởi Thịnh');
  expect(html).toContain('Mở lại · 07/11/2026 · Ghi bởi Tài khoản đã xóa');
});
