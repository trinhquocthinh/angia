import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '../../application/ports';
import { NewProfileDialog } from './NewProfileDialog';

const session: ProfileSession = {
  role: 'main',
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà Thịnh' },
  csrfToken: 'csrf',
};
const props = {
  session,
  accounts: [],
  accountsLoading: false,
  accountsError: false,
  retry: () => undefined,
  pending: false,
  onSave: async () => undefined,
  onClose: () => undefined,
};

describe('Hộp thoại tạo hồ sơ mới', () => {
  it('hiển thị tiêu đề, tên gia đình và nút đóng trong dialog được gắn nhãn', () => {
    const html = renderToStaticMarkup(<NewProfileDialog {...props} />);
    expect(html).toContain('<dialog');
    expect(html).toContain('aria-labelledby="new-profile-title"');
    expect(html).toContain('id="new-profile-title"');
    expect(html).toContain('Tạo hồ sơ thành viên mới');
    expect(html).toContain('Thêm thông tin người thân vào sổ của Nhà Thịnh');
    expect(html).toContain('aria-label="Đóng"');
    expect(html).toContain('name="displayName"');
  });
  it('tài khoản không phải người chăm sóc chính chỉ thấy thông báo, không thấy form', () => {
    const html = renderToStaticMarkup(
      <NewProfileDialog {...props} session={{ ...session, role: 'member' }} />,
    );
    expect(html).toContain('Chỉ người chăm sóc chính có thể tạo hồ sơ sức khỏe.');
    expect(html).not.toContain('name="displayName"');
  });
});
