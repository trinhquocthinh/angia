import { describe, expect, it } from 'vitest';
import { isReading, reviewPollInterval, reviewItemState } from './reviewQueuePolling';
import type { SourceDocument } from './reviewPorts';

const doc = (status: SourceDocument['status'], type: SourceDocument['type'] = 'device_reading') =>
  ({ id: status, status, type }) as SourceDocument;

describe('Hàng đợi khi AI đang đọc ảnh', () => {
  it('hỏi lại mỗi 3 giây khi còn chứng từ uploaded/extracting; hết thì dừng', () => {
    expect(reviewPollInterval([doc('pending_review'), doc('extracting')])).toBe(3000);
    expect(reviewPollInterval([doc('uploaded')])).toBe(3000);
    expect(reviewPollInterval([doc('pending_review'), doc('manual_entry')])).toBe(false);
    expect(reviewPollInterval(undefined)).toBe(false);
    expect(isReading(doc('extracting'))).toBe(true);
  });

  it('trạng thái hiển thị: đang đọc, sẵn sàng duyệt, duyệt ở bản sau, cần nhập tay', () => {
    expect(reviewItemState(doc('uploaded'))).toBe('preparing');
    expect(reviewItemState(doc('extracting', null))).toBe('reading');
    expect(reviewItemState(doc('pending_review'))).toBe('ready');
    expect(reviewItemState(doc('pending_review', 'prescription'))).toBe('later');
    expect(reviewItemState(doc('manual_entry'))).toBe('manual');
  });
});

it('TC-155: awaiting_privacy vẫn hiển thị chờ riêng tư, không polling như AI đang đọc', () => {
  expect(reviewItemState(doc('awaiting_privacy'))).toBe('privacy');
  expect(reviewPollInterval([doc('awaiting_privacy')])).toBe(false);
});
