/// <reference types="node" />
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
const source = readFileSync(new URL('../../../../public/sw.js', import.meta.url), 'utf8');
function harness() {
  const handlers = new Map<string, (event: unknown) => void>();
  const notices: unknown[][] = [];
  const opened: string[] = [];
  const self = {
    location: { origin: 'https://angia.test' },
    addEventListener: (name: string, fn: (e: unknown) => void) => handlers.set(name, fn),
    registration: {
      showNotification: async (...args: unknown[]) => {
        notices.push(args);
      },
    },
    clients: {
      openWindow: async (url: string) => {
        opened.push(url);
      },
    },
  };
  vm.runInNewContext(source, { self, URL });
  return { handlers, notices, opened };
}
describe('Service worker AN GIA', () => {
  it('TC-343: bỏ title/body/URL chứa PII trong payload', async () => {
    const h = harness();
    let work: unknown;
    h.handlers.get('push')!({
      data: { json: () => ({ title: 'Tên bệnh nhân', body: 'Thuốc bí mật', url: 'https://evil.test' }) },
      waitUntil: (p: unknown) => {
        work = p;
      },
    });
    await work;
    expect(h.notices[0]?.[0]).toBe('AN GIA');
    expect(h.notices[0]?.[1]).toMatchObject({ body: 'Đến giờ dùng thuốc' });
    expect(h.handlers.has('fetch')).toBe(false);
  });
  it('TC-346: bấm payload không hợp lệ chỉ về trang thông báo cùng origin', async () => {
    const h = harness();
    let work: unknown;
    h.handlers.get('notificationclick')!({
      notification: {
        close: () => undefined,
        data: { reminderId: 'https://evil.test', url: 'https://evil.test' },
      },
      waitUntil: (p: unknown) => {
        work = p;
      },
    });
    await work;
    expect(h.opened).toEqual(['https://angia.test/notifications']);
  });
});
