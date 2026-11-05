import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { chain, detail, item, profileId, firstId } from '../test/fixtures.test-helper';
import { PrescriptionChain } from './PrescriptionChain';
import { PrescriptionComparison } from './PrescriptionComparison';
import { PrescriptionDetailView } from './PrescriptionDetailView';
import { PrescriptionLoadState } from './PrescriptionLoadState';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
describe('TC-481/482/483 — trình bày chuỗi và so sánh trung tính', () => {
  it('giữ thứ tự chuỗi API và mô tả hai nguồn, ngày hẹn, số dòng', () => {
    const html = renderToStaticMarkup(<PrescriptionChain data={chain} profileId={profileId} />);
    expect(html.indexOf('01/10/2026')).toBeLessThan(html.indexOf('01/11/2026'));
    for (const text of ['Từ giấy tờ', 'Nhập tay', '2 dòng thuốc', 'Ngày hẹn', 'Nơi khám A'])
      expect(html).toContain(text);
    expect(renderToStaticMarkup(<PrescriptionChain data={[]} profileId={profileId} />)).toContain(
      'Chưa có đơn thuốc đã lưu.',
    );
  });
  it('hiện hai ngày, ba nhóm và trường thay đổi; không hiện nhóm so sánh cho đơn đầu', () => {
    const html = renderToStaticMarkup(
      <PrescriptionComparison diff={detail.diff} previousDate="2026-10-01" currentDate="2026-11-01" />,
    );
    for (const text of [
      'Thêm',
      'Bỏ',
      'Thay đổi',
      'Thuốc A',
      'Thuốc B',
      'Thuốc C',
      '5 mg',
      '10 mg',
      'Hàm lượng',
      '01/10/2026',
      '01/11/2026',
    ])
      expect(html).toContain(text);
    expect(html).not.toMatch(/bất thường|tốt hơn|xấu hơn|khuyên dùng|tăng liều|giảm liều/i);
    expect(
      renderToStaticMarkup(
        <PrescriptionComparison diff={null} previousDate={null} currentDate="2026-11-01" />,
      ),
    ).toBe('');
  });
  it('không có thay đổi vẫn giải thích phạm vi so sánh', () => {
    expect(
      renderToStaticMarkup(
        <PrescriptionComparison
          diff={{ added: [], removed: [], changed: [] }}
          previousDate="2026-10-01"
          currentDate="2026-11-01"
        />,
      ),
    ).toContain('Không có thay đổi ở các trường được so sánh.');
  });
  it('hiển thị đúng mọi field API, null và false không bị mất', () => {
    const diff = {
      added: [],
      removed: [],
      changed: [
        {
          name: 'Thuốc A',
          changes: [
            { field: 'strength' as const, before: null, after: '10 mg' },
            { field: 'quantityPerDose' as const, before: null, after: 0.5 },
            { field: 'doseUnit' as const, before: null, after: 'viên' },
            { field: 'slots' as const, before: ['morning' as const], after: ['as_needed' as const] },
            { field: 'durationDays' as const, before: 30, after: null },
            { field: 'longTerm' as const, before: false, after: true },
            { field: 'externalUse' as const, before: false, after: true },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(
      <PrescriptionComparison diff={diff} previousDate="2026-10-01" currentDate="2026-11-01" />,
    );
    for (const text of [
      'Không ghi',
      '10 mg',
      '0,5',
      'viên',
      'Sáng',
      'Khi cần',
      '30',
      'Dài hạn',
      'Dùng ngoài',
      'Không',
      'Có',
    ])
      expect(html).toContain(text);
  });
  it('lines giữ đủ dòng hai bên, không tự ghép cặp', () => {
    const diff = {
      added: [],
      removed: [],
      changed: [
        {
          name: 'Thuốc A',
          changes: [
            {
              field: 'lines' as const,
              before: [item],
              after: [
                { ...item, strength: '10 mg' },
                { ...item, strength: '20 mg', note: 'Dòng thứ hai' },
              ],
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(
      <PrescriptionComparison diff={diff} previousDate="2026-10-01" currentDate="2026-11-01" />,
    );
    expect(html.match(/Thuốc A/g)).toHaveLength(4);
    for (const text of ['Trước', 'Sau', '5 mg', '10 mg', '20 mg', 'Dòng thứ hai'])
      expect(html).toContain(text);
  });
  it('chi tiết đầy đủ, điều hướng theo ID API và ảnh chỉ ở đơn có chứng từ', () => {
    const html = renderToStaticMarkup(<PrescriptionDetailView data={detail} previousDate="2026-10-01" />);
    for (const text of ['Đơn trước', 'Nội dung trên đơn', 'Ghi trên đơn', 'Tổng số lượng', '30'])
      expect(html).toContain(text);
    expect(html).not.toContain('Đơn sau');
    expect(html).not.toContain('Xem ảnh giấy tờ');
    const first = {
      ...detail,
      previousId: null,
      nextId: detail.prescription.id,
      diff: null,
      prescription: { ...detail.prescription, sourceDocumentId: firstId, manualWithoutSource: false },
    };
    const firstHtml = renderToStaticMarkup(<PrescriptionDetailView data={first} previousDate={null} />);
    expect(firstHtml).not.toContain('Đơn trước');
    expect(firstHtml).toContain('Đơn sau');
    expect(firstHtml).toContain(`/api/source-documents/${firstId}/image`);
  });
  it('lỗi không tìm thấy/đồng thuận có thông báo rõ và nút thử lại; loading có status', () => {
    const render = (status: number) =>
      renderToStaticMarkup(
        <PrescriptionLoadState error={Object.assign(new Error('lỗi'), { status })} retry={() => undefined} />,
      );
    expect(render(404)).toContain('Không tìm thấy đơn thuốc hoặc hồ sơ này.');
    expect(render(409)).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(render(500)).toContain('Thử lại');
    expect(renderToStaticMarkup(<PrescriptionLoadState retry={() => undefined} />)).toContain(
      'role="status"',
    );
  });
});
