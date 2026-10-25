import { describe, expect, it, vi } from 'vitest';
import { createInstallPrompt } from './installPrompt';

function setup() {
  const target = new EventTarget();
  const store = createInstallPrompt(target);
  const listener = vi.fn();
  store.subscribe(listener);
  return { target, store, listener };
}
function deferred(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = vi.fn(async () => undefined);
  return Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
}
describe('TC-372 Nút cài AN GIA một chạm trên Android', () => {
  it('chưa có beforeinstallprompt → không có nút cài', () => {
    const { store } = setup();
    expect(store.available()).toBe(false);
  });
  it('giữ lời mời cài của trình duyệt, chặn banner mặc định và báo cho giao diện', () => {
    const { target, store, listener } = setup();
    const event = deferred('accepted');
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(store.available()).toBe(true);
    expect(listener).toHaveBeenCalled();
  });
  it('bấm cài → mở hộp thoại hệ thống một lần rồi bỏ lời mời đã dùng', async () => {
    const { target, store } = setup();
    const event = deferred('dismissed');
    target.dispatchEvent(event);
    await expect(store.promptInstall()).resolves.toBe('dismissed');
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(store.available()).toBe(false);
    await expect(store.promptInstall()).resolves.toBe('unavailable');
  });
  it('đã cài xong (appinstalled) → ẩn nút cài', () => {
    const { target, store } = setup();
    target.dispatchEvent(deferred('accepted'));
    target.dispatchEvent(new Event('appinstalled'));
    expect(store.available()).toBe(false);
  });
});
