import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { LabResultPayload } from '../../application/reviewPorts';
import { LabResultForm } from './LabResultForm';

const payload: LabResultPayload = {
  type: 'lab_result',
  resultDate: '2026-10-01',
  facility: 'Trung tâm Y tế Thành phố',
  items: [
    { testName: 'HbA1c', value: '9.8', unit: '%', referenceRange: '4.0 - 6.0' },
    { testName: 'Glucose', value: '7.2', unit: 'mmol/L', referenceRange: null },
  ],
};

const props = { pending: false, error: null, onSubmit: () => undefined };

describe('Form duyệt kết quả xét nghiệm (SPEC-010, BR-022)', () => {
  // Giá trị ô nhập do RHF gán sau khi mount; ánh xạ giá trị đã kiểm ở labResultForm.test.ts.
  it('có ngày kết quả bắt buộc, nơi xét nghiệm và mỗi chỉ số một khối đủ 4 ô', () => {
    const html = renderToStaticMarkup(<LabResultForm {...props} payload={payload} />);
    expect(html).toContain('Ngày trả kết quả *');
    expect(html).toContain('name="facility"');
    expect(html).toContain('Danh sách chỉ số (2 chỉ số)');
    for (const field of ['testName', 'value', 'unit', 'referenceRange'])
      expect(html).toContain(`name="items.1.${field}"`);
    expect(html).toContain('+ Thêm chỉ số');
    expect(html).toContain('Xóa dòng 2');
  });

  it('BR-022: nhắc chép khoảng tham chiếu in trên phiếu, không tự điền', () => {
    const html = renderToStaticMarkup(<LabResultForm {...props} payload={payload} />);
    expect(html).toContain('Khoảng tham chiếu in trên phiếu');
    expect(html).toContain('Phiếu không in thì để trống.');
  });

  it('BR-033: không gắn nhãn cao/thấp/bất thường dù kết quả nằm ngoài khoảng tham chiếu', () => {
    const html = renderToStaticMarkup(<LabResultForm {...props} payload={payload} />).toLowerCase();
    for (const word of ['cao', 'thấp', 'bất thường', 'vượt', 'tốt', 'xấu']) expect(html).not.toContain(word);
  });

  it('chưa có bản trích xuất thì mở một dòng trống, không có nút xóa dòng cuối cùng', () => {
    const html = renderToStaticMarkup(<LabResultForm {...props} payload={null} />);
    expect(html).toContain('Chưa có dữ liệu AI trích xuất, vui lòng nhập theo ảnh.');
    expect(html).toContain('AI không đọc được ngày, vui lòng nhập theo phiếu.');
    expect(html).toContain('id="lab-item-0"');
    expect(html).not.toContain('Xóa dòng 1');
  });
});
