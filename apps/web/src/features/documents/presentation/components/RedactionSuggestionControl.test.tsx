import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SuggestionStatus } from '../../application/requestRedactionSuggestions';
import { RedactionSuggestionControl } from './RedactionSuggestionControl';

const render = (status: SuggestionStatus, blockedReason: string | null = null) =>
  renderToStaticMarkup(
    <RedactionSuggestionControl
      status={status}
      blockedReason={blockedReason}
      onRun={() => {}}
      onCancel={() => {}}
    />,
  );

describe('Nút "Gợi ý vùng che" (SPEC-083)', () => {
  it('sẵn sàng: có thông báo gửi ảnh và nhắc xoay trước', () => {
    const html = render({ kind: 'idle' });
    expect(html).toContain('Gợi ý vùng che');
    expect(html).toContain('Ảnh không được lưu và không gửi ra ngoài');
    expect(html).toContain('Xoay ảnh cho đúng chiều trước khi gợi ý');
    expect(html).not.toContain('disabled=""');
  });

  it('chưa chọn hồ sơ: khoá nút và nêu lý do', () => {
    const html = render({ kind: 'idle' }, 'Chọn hồ sơ ở trên để dùng gợi ý vùng che.');
    expect(html).toContain('disabled=""');
    expect(html).toContain('Chọn hồ sơ ở trên');
  });

  it('TC-893: đang chờ có nút Huỷ; bận/lỗi báo vẫn tự che được', () => {
    expect(render({ kind: 'loading' })).toContain('Huỷ');
    expect(render({ kind: 'error', reason: 'busy' })).toContain('Máy chủ đang bận');
    expect(render({ kind: 'error', reason: 'unavailable' })).toContain('Chưa gợi ý được lúc này');
  });

  it('báo số vùng đã thêm, vùng bị bỏ vì đủ 32, hoặc không tìm thấy', () => {
    expect(render({ kind: 'done', added: 3, dropped: 0 })).toContain('Đã thêm 3 vùng che gợi ý');
    expect(render({ kind: 'done', added: 2, dropped: 4 })).toContain('Còn 4 vùng chưa thêm được');
    expect(render({ kind: 'done', added: 0, dropped: 0 })).toContain('Không tìm thấy thông tin cá nhân');
  });
});
