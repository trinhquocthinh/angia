import type { DocumentEntry } from '@angia/contracts';
import { describe, expect, it } from 'vitest';
import { entry } from './documentEntryFixtures.test-helper';
import { entryAction, entryDateLabel, entryStatusLabel, entryTitle } from './entryPresentation';

describe('TC-282 trình bày mục danh mục chứng từ', () => {
  it('nhãn trạng thái trung tính, đang xử lý gộp chung một nhãn', () => {
    const label = (status: string) => entryStatusLabel(entry({ status: status as DocumentEntry['status'] }));
    expect(label('approved')).toBe('Đã lưu vào sổ');
    expect(label('pending_review')).toBe('Chờ duyệt');
    for (const status of ['uploaded', 'extracting', 'awaiting_budget'])
      expect(label(status)).toBe('Đang xử lý');
    expect(label('manual_entry')).toBe('Cần nhập tay');
    expect(label('manual_record')).toBe('Nhập tay, không có ảnh');
  });

  it('tiêu đề theo loại, chưa phân loại có tiêu đề riêng', () => {
    expect(entryTitle(entry({ type: 'prescription' }))).toBe('Đơn thuốc');
    expect(entryTitle(entry({ type: 'lab_result' }))).toBe('Phiếu xét nghiệm');
    expect(entryTitle(entry({ type: 'device_reading' }))).toBe('Ảnh máy đo');
    expect(entryTitle(entry({ type: null }))).toBe('Chưa phân loại');
  });

  it('hành động: đã lưu → chi tiết; chờ duyệt/cần nhập tay/chờ ngân sách → duyệt; đang xử lý → không', () => {
    expect(entryAction(entry({ status: 'approved' }))).toBe('detail');
    expect(entryAction(entry({ origin: 'manual', status: 'manual_record' }))).toBe('detail');
    for (const status of ['pending_review', 'manual_entry', 'awaiting_budget'] as const)
      expect(entryAction(entry({ status }))).toBe('review');
    for (const status of ['uploaded', 'extracting'] as const)
      expect(entryAction(entry({ status }))).toBe('none');
  });

  it('ngày: đã rõ → dd/mm/yyyy; chưa rõ → ghi ngày tải lên', () => {
    expect(entryDateLabel(entry({ entryDate: '2026-10-01' }))).toBe('01/10/2026');
    expect(entryDateLabel(entry({ entryDate: '2026-10-13', dateKnown: false }))).toBe(
      'Chưa rõ ngày · tải lên 13/10/2026',
    );
  });
});
