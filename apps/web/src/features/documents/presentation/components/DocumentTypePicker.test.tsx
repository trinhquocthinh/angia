import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DocumentTypePicker } from './DocumentTypePicker';

describe('Chọn loại giấy tờ khi tải lô ảnh (SPEC-008 declaredType tùy chọn)', () => {
  it('mặc định "Tự động nhận diện" được chọn và có lời giải thích cho lô trộn nhiều loại', () => {
    const html = renderToStaticMarkup(<DocumentTypePicker value={null} onChange={() => undefined} />);
    expect(html).toMatch(/aria-pressed="true"[^>]*>(<[^>]+>)*[^<]*Tự động nhận diện/);
    expect(html).toContain('Mỗi ảnh được đọc riêng để biết loại giấy tờ');
  });

  it('đã chọn một loại thì chip đó sáng, "Tự động nhận diện" tắt (bấm để bỏ chọn)', () => {
    const html = renderToStaticMarkup(<DocumentTypePicker value="prescription" onChange={() => undefined} />);
    expect(html).toMatch(/aria-pressed="false"[^>]*>(<[^>]+>)*[^<]*Tự động nhận diện/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>(<[^>]+>)*Đơn thuốc/);
    expect(html).toContain('ảnh khác loại sẽ chuyển sang nhập tay');
  });
});

it('TC-447 — ẩn Máy đo cá nhân, giữ tự động nhận diện và các loại còn lại', () => {
  const html = renderToStaticMarkup(
    <DocumentTypePicker value={null} onChange={() => undefined} allowDeviceReading={false} />,
  );
  expect(html).not.toContain('Máy đo cá nhân');
  expect(html).toContain('Tự động nhận diện');
  expect(html).toContain('Đơn thuốc');
  expect(html).toContain('Xét nghiệm');
});
