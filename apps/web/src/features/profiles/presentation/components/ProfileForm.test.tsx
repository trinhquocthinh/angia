import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileIdentityFields } from './ProfileIdentityFields';
import { NewProfileForm } from './NewProfileForm';
describe('Form tạo hồ sơ và lựa chọn đồng thuận rõ ràng', () => {
  it('hiển thị tài khoản có thể liên kết, không tự xác nhận', () => {
    const html = renderToStaticMarkup(
      <NewProfileForm
        currentAccountId="a"
        accounts={[{ id: 'a', displayName: 'An' }]}
        accountsLoading={false}
        accountsError={false}
        retry={() => undefined}
        pending={false}
        onSave={async () => undefined}
      />,
    );
    expect(html).toContain('Không liên kết tài khoản');
    expect(html).toContain('An');
    expect(html).toContain('Tôi đã hỏi và được đồng ý');
    expect(html).not.toContain('checked=');
    expect(html).toContain('Đây là hồ sơ của tôi');
  });
  it('TC-449 — năm sinh được đánh dấu bắt buộc khi tạo hồ sơ', () => {
    const html = renderToStaticMarkup(<ProfileIdentityFields errors={{}} />);
    const yearInput = html.match(/<input[^>]*name="birthYear"[^>]*>/)?.[0];
    expect(yearInput).toContain('required=""');
    expect(html).not.toContain('tùy chọn');
  });
  it('khóa form và hiển thị đang lưu trong lúc gửi', () => {
    const html = renderToStaticMarkup(
      <NewProfileForm
        currentAccountId="a"
        accounts={[]}
        accountsLoading={false}
        accountsError={false}
        retry={() => undefined}
        pending
        onSave={async () => undefined}
      />,
    );
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toContain('Đang lưu…');
  });
});
