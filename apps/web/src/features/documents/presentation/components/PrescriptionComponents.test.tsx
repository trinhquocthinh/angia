import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PrescriptionPayload } from '../../application/reviewPorts';
import { PrescriptionErrorSummary } from './PrescriptionErrorSummary';
import { PrescriptionForm } from './PrescriptionForm';

const payload: PrescriptionPayload = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: 'BV Nhân dân Gia Định',
  diagnosis: 'Tăng huyết áp',
  items: [
    {
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: null,
      longTerm: true,
      note: null,
      totalQuantity: null,
    },
  ],
};

const props = { pending: false, error: null, onSubmit: () => undefined };

describe('Form duyệt đơn thuốc (SPEC-010, BR-025)', () => {
  // Giá trị ô nhập do RHF gán sau khi mount; ánh xạ giá trị đã kiểm ở prescriptionForm.test.ts.
  it('có ngày kê bắt buộc, nơi khám, chẩn đoán và mỗi dòng thuốc một khối', () => {
    const html = renderToStaticMarkup(<PrescriptionForm {...props} payload={payload} />);
    expect(html).toContain('Ngày kê đơn *');
    expect(html).toContain('name="facility"');
    expect(html).toContain('Chẩn đoán ghi trên đơn');
    expect(html).toContain('Danh sách thuốc (1 loại)');
    expect(html).toContain('name="items.0.name"');
    expect(html).toContain('+ Thêm thuốc');
  });

  it('đánh dấu buổi đã chọn và khóa ô số ngày khi dài hạn', () => {
    const html = renderToStaticMarkup(<PrescriptionForm {...props} payload={payload} />);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Sáng/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Tối/);
    expect(html).toMatch(/id="items-0-durationDays"[^>]*readOnly=""/);
  });

  it('nhắc đối chiếu liều mỗi lần do AI điền (carry-over E1)', () => {
    const html = renderToStaticMarkup(<PrescriptionForm {...props} payload={payload} />);
    expect(html).toContain('AI đọc — đối chiếu số lượng với ảnh.');
  });

  it('chưa có bản trích xuất thì mở một dòng trống, không có nút xóa dòng cuối cùng', () => {
    const html = renderToStaticMarkup(<PrescriptionForm {...props} payload={null} />);
    expect(html).toContain('Chưa có dữ liệu AI trích xuất, vui lòng nhập theo ảnh.');
    expect(html).toContain('id="rx-item-0"');
    expect(html).not.toContain('Xóa dòng 1');
    expect(html).not.toContain('AI đọc — đối chiếu');
  });

  it('BR-025: gợi ý số ngày từ tổng số lượng chỉ hiện nút Áp dụng, không tự điền ô số ngày', () => {
    const item = { ...payload.items[0]!, slots: ['morning', 'evening'] as const, longTerm: false };
    const suggested = { ...payload, items: [{ ...item, slots: [...item.slots], totalQuantity: 30 }] };
    const html = renderToStaticMarkup(<PrescriptionForm {...props} payload={suggested} />);
    expect(html).toContain('30 ÷ (1 × 2 buổi) =');
    expect(html).toContain('Áp dụng 15 ngày');
    const noTotal = renderToStaticMarkup(<PrescriptionForm {...props} payload={payload} />);
    expect(noTotal).not.toContain('Áp dụng');
  });

  it('không có ô bác sĩ điều trị', () => {
    expect(renderToStaticMarkup(<PrescriptionForm {...props} payload={payload} />)).not.toContain('Bác sĩ');
  });
});

describe('Tóm tắt dòng lỗi', () => {
  it('liên kết tới đúng dòng thuốc thiếu thông tin', () => {
    const html = renderToStaticMarkup(
      <PrescriptionErrorSummary
        rows={[{ index: 1, label: 'Dòng 2 · Metformin', messages: ['Chọn ít nhất một buổi dùng.'] }]}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('href="#rx-item-1"');
    expect(html).toContain('Dòng 2 · Metformin');
    expect(html).toContain('Chọn ít nhất một buổi dùng.');
  });

  it('không hiện gì khi không có dòng lỗi', () => {
    expect(renderToStaticMarkup(<PrescriptionErrorSummary rows={[]} />)).toBe('');
  });
});
