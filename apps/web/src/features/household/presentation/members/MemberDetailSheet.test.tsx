import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { MemberDetailSheet } from './MemberDetailSheet';

it.each([null, 'Người này không còn trong nhà.'])(
  'E28-S3-T2b: sheet có tên truy cập và nút đóng nhận focus cả khi thông báo là %s',
  (notice) => {
    const html = renderToStaticMarkup(
      <MemberDetailSheet onClose={vi.fn()} returnFocusRef={{ current: null }}>
        <p>{notice ?? 'Chi tiết phân quyền'}</p>
      </MemberDetailSheet>,
    );
    expect(html).toContain('aria-label="Chi tiết thành viên"');
    expect(html).toMatch(/<button[^>]*data-autofocus="true"[^>]*aria-label="Đóng chi tiết thành viên"/);
  },
);
