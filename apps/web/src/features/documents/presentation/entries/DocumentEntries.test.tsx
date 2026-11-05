import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { DocumentEntry } from '@angia/contracts';
import { ProfileTabs } from '@src/features/measurements/presentation/components/ProfileTabs';
import { entry, savedPrescription } from '../../application/documentEntryFixtures.test-helper';
import { DocumentEntryList } from './DocumentEntryList';
import { DocumentEntryPanel } from './DocumentEntryPanel';
import { DocumentTypeFilter } from './DocumentTypeFilter';
import { ReusePrescriptionForm } from './ReusePrescriptionForm';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; 'aria-current'?: 'page' }) => (
    <a aria-current={props['aria-current']}>{children}</a>
  ),
}));

const labResult = {
  id: 'l1',
  healthProfileId: 'p',
  sourceDocumentId: 'd',
  resultDate: '2026-10-01',
  testName: 'HbA1c',
  value: '7,1',
  unit: '%',
  referenceRange: null,
  facility: 'BV Gia Định',
  manualWithoutSource: false,
  createdAt: '2026-10-01T03:00:00.000Z',
};
const items: DocumentEntry[] = [
  entry({
    id: 'pending',
    status: 'pending_review',
    entryDate: '2026-10-13',
    dateKnown: false,
    records: { prescription: null, labResults: [], measurements: [] },
  }),
  entry({
    id: 'rx',
    origin: 'manual',
    type: 'prescription',
    status: 'manual_record',
    entryDate: '2026-10-05',
    records: { prescription: savedPrescription, labResults: [], measurements: [] },
  }),
  entry({ id: 'lab', records: { prescription: null, labResults: [labResult], measurements: [] } }),
];
const list = (props: Partial<Parameters<typeof DocumentEntryList>[0]> = {}) =>
  renderToStaticMarkup(
    <DocumentEntryList
      items={items}
      loading={false}
      error={false}
      retry={() => undefined}
      hasMore={false}
      loadingMore={false}
      loadMore={() => undefined}
      onOpen={() => undefined}
      {...props}
    />,
  );

describe('TC-285 tab Hồ sơ & Giấy tờ khám', () => {
  it('tab là link và sáng khi đang mở', () => {
    const html = renderToStaticMarkup(<ProfileTabs profileId="p" active="documents" />);
    expect(html).toContain('<a aria-current="page">Hồ sơ &amp; Giấy tờ khám</a>');
    expect(html).not.toContain('disabled');
  });

  it('chip lọc có aria-pressed đúng chip đang chọn', () => {
    const html = renderToStaticMarkup(<DocumentTypeFilter value="lab_result" onChange={() => undefined} />);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Phiếu xét nghiệm/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Tất cả/);
  });

  it('nhóm theo tháng, nhãn trung tính, tóm tắt bản ghi nguyên văn; "Xem thêm" chỉ khi còn trang', () => {
    const html = list();
    expect(html).toContain('Tháng 10/2026');
    expect(html).toContain('3 mục');
    expect(html).toContain('Chưa rõ ngày · tải lên 13/10/2026');
    expect(html).toContain('Mở để duyệt');
    expect(html).toContain('Nhập tay, không có ảnh');
    expect(html).toContain('Amlodipin 5mg');
    expect(html).toContain('Phiếu không in khoảng tham chiếu');
    expect(html).not.toContain('Xem thêm');
    expect(list({ hasMore: true })).toContain('Xem thêm');
    expect(html).not.toMatch(/bình thường|bất thường|cần chú ý|tốt|xấu/i);
  });

  it('rỗng, đang tải, lỗi', () => {
    expect(list({ items: [] })).toContain('Chưa có giấy tờ khám.');
    expect(list({ loading: true })).toContain('Đang tải giấy tờ khám');
    expect(list({ error: true })).toContain('Không tải được giấy tờ khám.');
  });

  it('TC-434: ngăn chi tiết chỉ hiện một bản đã che; ảnh đã xóa thì báo, không có <img>', () => {
    const panel = (value: DocumentEntry) =>
      renderToStaticMarkup(
        <DocumentEntryPanel entry={value} canReuse onReuse={() => undefined} onClose={() => undefined} />,
      );
    const shown = panel(entry());
    expect(shown.match(/<img/g)).toHaveLength(1);
    expect(shown).toContain(`src="/api/source-documents/${entry().id}/image"`);
    expect(shown).toContain('Đây là bản đã che. AN GIA không lưu ảnh chưa che.');
    expect(shown).not.toContain('<details');
    expect(shown).not.toContain('variant=');
    expect(shown).not.toContain('Dùng lại đơn này');
    const purged = panel(entry({ hasImage: false }));
    expect(purged).toContain('Ảnh đã được xóa để bảo vệ riêng tư');
    expect(purged).not.toContain('<img');
    const rx = panel(items[1]!);
    expect(rx).toContain('Dùng lại đơn này');
    expect(rx).not.toContain('<img');
  });

  it('form Dùng lại: ngày trong khoảng, mọi dòng chọn sẵn, dòng dài hạn bật Dài hạn', () => {
    const state = {
      pending: false,
      saved: null,
      error: null,
      request: null,
      prompt: null,
      submit: async () => true,
      reset: () => undefined,
    };
    const html = renderToStaticMarkup(
      <ReusePrescriptionForm prescription={savedPrescription} today="2026-10-13" state={state} />,
    );
    expect(html).toContain('min="2026-10-02"');
    expect(html).toContain('max="2026-11-12"');
    const inputs = html.match(/<input[^>]*>/g) ?? [];
    const checked = (pattern: RegExp) => inputs.filter((i) => pattern.test(i) && i.includes('checked=""'));
    expect(checked(/^(?!.*role="switch").*type="checkbox"/)).toHaveLength(3);
    expect(checked(/role="switch"/)).toHaveLength(1);
    expect(html).toContain('Tạo đợt thuốc');
  });
});
