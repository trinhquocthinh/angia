import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DeviceReadingPayload } from '../../application/reviewPorts';
import { ReviewRequestError } from '../../application/ReviewRequestError';
import { ReadingForm } from './ReadingForm';

const payload: DeviceReadingPayload = {
  type: 'device_reading',
  measuredAt: '2026-10-05',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: 261,
  diastolic: 90,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
};

const props = { payload, pending: false, onSubmit: () => undefined };
const submitButton = /<button type="submit"[^>]*>/;

describe('Hộp xác nhận ngoài khoảng khả dĩ trên form máy đo (SPEC-019, BR-021)', () => {
  it('chưa có phản hồi API thì không hiện hộp xác nhận và nút Lưu bấm được', () => {
    const html = renderToStaticMarkup(<ReadingForm {...props} error={null} />);
    expect(html).not.toContain('Tôi đã đối chiếu với ảnh');
    expect(html.match(submitButton)?.[0]).not.toContain('disabled=""');
  });

  it('TC-082: API chặn tâm thu 261 thì đánh dấu đúng ô, hiện hộp xác nhận và khóa nút Lưu', () => {
    const error = new ReviewRequestError('Ngoài khoảng', 422, 'ERR_OUT_OF_RANGE_UNCONFIRMED', ['systolic']);
    const html = renderToStaticMarkup(<ReadingForm {...props} error={error} />);
    expect(html).toContain('Số <strong>tâm thu</strong> nằm ngoài khoảng giá trị máy đo thường ghi nhận.');
    expect(html).toContain('Tôi đã đối chiếu với ảnh, số đo đúng như trên máy');
    expect(html).toMatch(/id="systolic" aria-invalid="true"/);
    expect(html).not.toMatch(/id="diastolic" aria-invalid="true"/);
    expect(html.match(submitButton)?.[0]).toContain('disabled=""');
    expect(html).not.toContain('Ngoài khoảng');
  });

  it('BR-033: lời nhắc trung tính, không đánh giá cao/thấp/bất thường', () => {
    const error = new ReviewRequestError('x', 422, 'ERR_OUT_OF_RANGE_UNCONFIRMED', ['glucoseValue']);
    const html = renderToStaticMarkup(<ReadingForm {...props} error={error} />).toLowerCase();
    for (const word of ['cao', 'thấp', 'bất thường', 'nguy hiểm']) expect(html).not.toContain(word);
  });

  it('lỗi khác của API hiện nguyên thông báo, không hiện hộp xác nhận', () => {
    const error = new ReviewRequestError('Chứng từ đã được duyệt.', 409, 'ERR_INVALID_STATE_TRANSITION');
    const html = renderToStaticMarkup(<ReadingForm {...props} error={error} />);
    expect(html).toContain('Chứng từ đã được duyệt.');
    expect(html).not.toContain('Tôi đã đối chiếu với ảnh');
  });
});
