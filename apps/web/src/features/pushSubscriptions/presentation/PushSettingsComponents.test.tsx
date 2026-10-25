import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { IosInstallGuide } from './IosInstallGuide';
import { LockScreenPreview } from './LockScreenPreview';
import { PushDeviceCard } from './PushDeviceCard';
import { PushDeviceDetails } from './PushDeviceDetails';

const config = { enabled: true, publicKey: 'k', registered: true };
describe('Giao diện thông báo trên thiết bị', () => {
  it('mô phỏng màn hình khóa chỉ có lời nhắc chung, không lộ thuốc hay thành viên', () => {
    const html = renderToStaticMarkup(<LockScreenPreview />);
    expect(html).toContain('Đến giờ dùng thuốc');
    expect(html).not.toMatch(/\d+\s?mg|Mẹ|Bố|Ông|Bà/);
  });
  it('công tắc phản ánh đúng trạng thái đăng ký và khóa khi chưa thao tác được', () => {
    const html = renderToStaticMarkup(
      <PushDeviceCard
        state={{ tone: 'active', label: 'Đang hoạt động', detail: '' }}
        registered
        canToggle={false}
        onToggle={() => undefined}
      />,
    );
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('Đang hoạt động');
  });
  it('thông số thiết bị đọc từ quyền thật và cấu hình máy chủ', () => {
    const html = renderToStaticMarkup(<PushDeviceDetails supported permission="denied" data={config} />);
    expect(html).toContain('Đã chặn');
    expect(html).toContain('Đã đăng ký');
    expect(html).toContain('Đang bật');
  });
  it('hướng dẫn iPhone liệt kê đủ bước Chia sẻ → Thêm vào Màn hình chính → mở từ biểu tượng', () => {
    const html = renderToStaticMarkup(<IosInstallGuide />);
    expect(html).toContain('<ol');
    expect(html.match(/<li/g)).toHaveLength(4);
    for (const text of ['Chia sẻ', 'Thêm vào Màn hình chính', 'Thêm', 'biểu tượng AN GIA', 'iOS 16.4'])
      expect(html).toContain(text);
  });
  it('chưa có cấu hình → không khẳng định trạng thái máy chủ', () => {
    const html = renderToStaticMarkup(
      <PushDeviceDetails supported={false} permission="unsupported" data={undefined} />,
    );
    expect(html).toContain('Chưa hỗ trợ');
    expect(html).not.toContain('Đã đăng ký');
    expect(html).not.toContain('Đang bật');
  });
});
