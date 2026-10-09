import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DuplicateNotice } from './DuplicateNotice';

const duplicate = {
  duplicateOf: 'doc-1',
  recordDate: '2026-10-01',
  facility: 'BV Tỉnh',
  savedAt: '2026-10-02T03:00:00.000Z',
};

describe('Cảnh báo chứng từ trùng (SPEC-012, BR-017)', () => {
  it('nêu bản đã lưu và cho chủ ý lưu thêm; lời lẽ trung tính', () => {
    const html = renderToStaticMarkup(
      <DuplicateNotice
        duplicate={duplicate}
        type="prescription"
        pending={false}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Giấy tờ này có vẻ đã được lưu trước đó');
    expect(html).toContain('đơn thuốc ngày 01/10/2026, BV Tỉnh, lưu hôm 02/10/2026');
    expect(html).toContain('Vẫn lưu bản này');
  });

  it('đang gửi lại thì khóa nút', () => {
    const html = renderToStaticMarkup(
      <DuplicateNotice duplicate={duplicate} type="lab_result" pending={true} onConfirm={() => undefined} />,
    );
    expect(html).toContain('disabled=""');
  });
});
