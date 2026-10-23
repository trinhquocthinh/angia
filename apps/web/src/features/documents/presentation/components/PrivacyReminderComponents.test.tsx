import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NoMaskWarning } from './NoMaskWarning';
import { UploadPrivacyReminder } from './UploadPrivacyReminder';

const noop = () => undefined;

describe('Nhắc che định danh (BR-041 bổ sung 2026-10-12)', () => {
  it('TC-245: cảnh báo không có vùng che là hộp thoại có hai lựa chọn, không tuyên bố tự phát hiện định danh', () => {
    const html = renderToStaticMarkup(<NoMaskWarning busy={false} onBack={noop} onSendAnyway={noop} />);
    expect(html).toContain('<dialog');
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-labelledby="no-mask-title"');
    expect(html).toContain('Ảnh chưa có vùng che nào');
    expect(html).toContain('Đóng và quay lại che thông tin');
    expect(html).toContain('Quay lại che thông tin');
    expect(html).toContain('Ảnh không có thông tin cá nhân — vẫn gửi');
    expect(html).not.toMatch(/tự (phát hiện|che)/);
  });

  it('TC-246: popup tải ảnh có hình minh hoạ ✗/✓, danh sách thông tin không chụp và lựa chọn không nhắc lại', () => {
    const html = renderToStaticMarkup(<UploadPrivacyReminder onClose={noop} />);
    expect(html).toContain('aria-labelledby="upload-privacy-title"');
    expect(html).toContain('Trước khi chụp và tải ảnh');
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html).toContain('✗ Không nên');
    expect(html).toContain('✓ Nên');
    for (const item of ['Họ tên, ngày sinh', 'Mã bệnh nhân, mã hồ sơ, số bảo hiểm y tế', 'Số CCCD'])
      expect(html).toContain(item);
    expect(html).toContain('Không nhắc lại trên thiết bị này');
    expect(html).toContain('Tôi đã hiểu');
  });
});
