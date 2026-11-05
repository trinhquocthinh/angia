import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { reviewItemState } from '../../application/reviewQueuePolling';
import type { SourceDocument } from '../../application/reviewPorts';
import { DocumentImagePanel } from './DocumentImagePanel';
import { ReviewItemChip } from './ReviewItemChip';

const document = (overrides: Partial<SourceDocument> = {}): SourceDocument => ({
  id: 'doc-1',
  healthProfileId: 'p',
  batchId: 'b',
  type: 'device_reading',
  status: 'pending_review',
  documentDate: null,
  mimeType: 'image/jpeg',
  sizeBytes: 1_258_291,
  hasImage: true,
  createdAt: '2026-10-29T03:00:00.000Z',
  ...overrides,
});

describe('TC-435 màn duyệt chỉ hiện bản đã che', () => {
  it('khung ảnh dùng route ảnh duy nhất, không có link "Mở ảnh gốc"', () => {
    const html = renderToStaticMarkup(<DocumentImagePanel document={document()} />);
    expect(html).toContain('/api/source-documents/doc-1/image"');
    expect(html).toContain('Đây là bản đã che. AN GIA không lưu ảnh chưa che.');
    expect(html).toContain('Xem toàn màn hình');
    expect(html).not.toMatch(/AI OCR|đầu cuối|chuẩn y khoa/);
    expect(html).not.toContain('Mở ảnh gốc');
    expect(html).not.toContain('variant=');
  });

  it('ảnh đã xóa thì báo, không tải ảnh và không cho xoay', () => {
    const html = renderToStaticMarkup(<DocumentImagePanel document={document({ hasImage: false })} />);
    expect(html).toContain('Ảnh đã được xóa để bảo vệ riêng tư');
    expect(html).not.toContain('/image"');
    expect(html).not.toContain('Xoay ảnh');
    expect(html).not.toContain('Xem toàn màn hình');
  });

  it('hàng chờ không còn nhãn "Chờ kiểm tra riêng tư" ở mọi trạng thái', () => {
    const statuses = [
      'uploaded',
      'extracting',
      'pending_review',
      'approved',
      'manual_entry',
      'awaiting_budget',
    ] as const satisfies readonly SourceDocument['status'][];
    for (const status of statuses) {
      const html = renderToStaticMarkup(<ReviewItemChip state={reviewItemState(document({ status }))} />);
      expect(html).not.toContain('Chờ kiểm tra riêng tư');
    }
  });
});
