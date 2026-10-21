/* global self */
/* Chỉ xử lý thông báo: không fetch/cache trang, API hoặc ảnh y tế. */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    /* Hiện nội dung chung khi payload lỗi. */
  }
  const reminderId =
    typeof payload.reminderId === 'string' &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(payload.reminderId)
      ? payload.reminderId
      : null;
  const test = payload.type === 'test';
  event.waitUntil(
    self.registration.showNotification('AN GIA', {
      body: test ? 'Đây là thông báo thử từ AN GIA.' : 'Đến giờ dùng thuốc',
      icon: '/icon-192.png',
      tag: reminderId ? `angia-reminder-${reminderId}` : 'angia-push-test',
      data: { reminderId, test },
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};
  const id =
    typeof data.reminderId === 'string' &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(data.reminderId)
      ? data.reminderId
      : null;
  const path = id ? `/reminders/${id}` : '/notifications';
  event.waitUntil(self.clients.openWindow(new URL(path, self.location.origin).href));
});
