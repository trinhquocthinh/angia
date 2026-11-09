import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProfileTabs } from '@src/features/measurements/presentation/components/ProfileTabs';
import { issue } from '../../test/painIssues.test-helper';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { PainJournalTab } from './PainJournalTab';
import { PainIssueCard } from '../PainIssueCard/PainIssueCard';
import type { ReactNode } from 'react';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    'aria-current': current,
  }: {
    children: ReactNode;
    to: string;
    params: { profileId: string };
    'aria-current'?: 'page';
  }) => (
    <a href={to.replace('$profileId', params.profileId)} aria-current={current}>
      {children}
    </a>
  ),
}));
const props = { issues: [issue], error: null, retry: () => undefined };
const resolved = {
  ...issue,
  id: 'resolved',
  status: 'resolved' as const,
  resolvedOn: '2026-11-07',
  title: 'Vấn đề cũ',
};
describe('E21-S2-T1 — tab và thẻ đau nhức', () => {
  it('tab sau dòng thời gian, vẫn hiện khi ẩn số đo và đánh dấu đang chọn', () => {
    const html = renderToStaticMarkup(<ProfileTabs profileId="p" active="pain" showsVitals={false} />);
    expect(html).toContain('href="/profiles/p/pain" aria-current="page"');
    expect(html.indexOf('Dòng thời gian')).toBeLessThan(html.indexOf('Đau nhức'));
    expect(html.indexOf('Đau nhức')).toBeLessThan(html.indexOf('Thuốc điều trị'));
    expect(html).not.toContain('Diễn biến sức khỏe');
  });
  it('hiện đúng vùng, giờ Việt Nam qua ngày, mức và số lần; không có thao tác chưa được nối', () => {
    const html = renderToStaticMarkup(<PainIssueCard issue={issue} />);
    for (const text of ['Đầu gối · trái', 'Sau khi đi bộ', '6', '/10', '07/11', '01:30', '3 lần ghi'])
      expect(html).toContain(text);
    expect(html).not.toMatch(/<button|<a |bất thường|nghiêm trọng/);
    const closed = renderToStaticMarkup(<PainIssueCard issue={resolved} />);
    expect(closed).toContain('Khỏi từ 07/11/2026');
    expect(closed).not.toContain('Ghi mức');
  });
  it('nhóm tracking trước, giữ thứ tự API trong nhóm; nhóm khỏi thu gọn', () => {
    const html = renderToStaticMarkup(
      <PainJournalTab
        {...props}
        issues={[
          resolved,
          { ...issue, title: 'Thẻ thứ nhất' },
          { ...issue, id: 'second', title: 'Thẻ thứ hai' },
        ]}
      />,
    );
    expect(html.indexOf('Thẻ thứ nhất')).toBeLessThan(html.indexOf('Thẻ thứ hai'));
    expect(html.indexOf('Thẻ thứ hai')).toBeLessThan(html.indexOf('Vấn đề cũ'));
    expect(html).toContain('<details');
    expect(html).not.toContain('open=""');
  });
  it('chỉ có đã khỏi thì mở sẵn; rỗng có hướng dẫn', () => {
    const html = renderToStaticMarkup(<PainJournalTab {...props} issues={[resolved]} />);
    expect(html).toContain('Không có vấn đề nào đang theo dõi.');
    expect(html).toContain('open=""');
    const empty = renderToStaticMarkup(<PainJournalTab {...props} issues={[]} />);
    expect(empty).toContain('Chưa ghi nhận đau nhức nào.');
    expect(empty).toContain('Khi có chỗ đau muốn theo dõi');
  });
  it('tải hai thẻ; lỗi che danh sách cũ và có thử lại; đồng thuận không dựng nội dung', () => {
    const loading = renderToStaticMarkup(<PainJournalTab {...props} issues={undefined} />);
    expect(loading).toContain('role="status"');
    expect(loading.match(/aria-hidden="true"/g)).toHaveLength(2);
    const error = renderToStaticMarkup(<PainJournalTab {...props} error={new Error('secret')} />);
    expect(error).toContain('Thử lại');
    expect(error).not.toMatch(/Sau khi đi bộ|secret/);
    const denied = renderToStaticMarkup(<PainJournalTab {...props} consentConfirmed={false} />);
    expect(denied).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(denied).not.toMatch(/Sau khi đi bộ|Thêm vấn đề đau/);
  });
  it('lỗi đồng thuận từ API không dựng danh sách hoặc thao tác ghi', () => {
    const html = renderToStaticMarkup(
      <PainJournalTab
        {...props}
        error={new MedicationRequestError('secret', 409, 'ERR_CONSENT_REQUIRED')}
        onCreate={() => undefined}
      />,
    );
    expect(html).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(html).not.toMatch(/Sau khi đi bộ|Thêm vấn đề đau|secret/);
  });
  it('chỉ hiện nút mở và ghi khi callback tương ứng được cung cấp', () => {
    const html = renderToStaticMarkup(
      <PainJournalTab
        {...props}
        onCreate={() => undefined}
        onOpen={() => undefined}
        onRecord={() => undefined}
      />,
    );
    expect(html).toContain('Thêm vấn đề đau');
    expect(html).toContain('Ghi mức');
    expect(html).toContain('Xem vấn đề');
  });
});
