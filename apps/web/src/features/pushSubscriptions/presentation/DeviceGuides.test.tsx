import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AndroidInstallGuide } from './AndroidInstallGuide';
import { DeviceGuide } from './DeviceGuide';
import { createInstallPrompt } from '../infrastructure/installPrompt';

const prompt = createInstallPrompt(new EventTarget());
const steps = (html: string) => html.match(/<li/g)?.length ?? 0;
describe('TC-373 Hướng dẫn cài đặt và mở lại thông báo', () => {
  it('trong Zalo/Facebook → chỉ cách mở bằng Safari hoặc Chrome', () => {
    const html = renderToStaticMarkup(<DeviceGuide guide="open-in-browser" installPrompt={prompt} />);
    for (const text of ['Zalo', 'Mở bằng trình duyệt', 'Safari', 'Chrome']) expect(html).toContain(text);
    expect(steps(html)).toBe(3);
  });
  it('Android có lời mời cài → nút cài một chạm', () => {
    const html = renderToStaticMarkup(<AndroidInstallGuide canPrompt onInstall={() => undefined} />);
    expect(html).toContain('<button');
    expect(html).toContain('Cài AN GIA lên điện thoại');
    expect(steps(html)).toBe(0);
  });
  it('Android chưa có lời mời → các bước cài qua menu ⋮', () => {
    const html = renderToStaticMarkup(<AndroidInstallGuide canPrompt={false} onInstall={() => undefined} />);
    expect(html).not.toContain('<button');
    for (const text of ['⋮', 'Thêm vào màn hình chính', 'Cài đặt ứng dụng', 'biểu tượng AN GIA'])
      expect(html).toContain(text);
    expect(steps(html)).toBe(3);
  });
  it('đã chặn trên iPhone → mở lại trong Cài đặt của máy', () => {
    const html = renderToStaticMarkup(<DeviceGuide guide="unblock-ios" installPrompt={prompt} />);
    for (const text of ['Cài đặt', 'Thông báo', 'AN GIA', 'Cho phép thông báo']) expect(html).toContain(text);
  });
  it('đã chặn trên Android → mở lại trong thông tin ứng dụng hoặc quyền của trang', () => {
    const html = renderToStaticMarkup(<DeviceGuide guide="unblock-android" installPrompt={prompt} />);
    for (const text of ['Thông tin ứng dụng', 'Thông báo', 'thanh địa chỉ', 'Quyền'])
      expect(html).toContain(text);
  });
  it('không cần hướng dẫn → không hiển thị gì', () => {
    expect(renderToStaticMarkup(<DeviceGuide guide="none" installPrompt={prompt} />)).toBe('');
  });
});
