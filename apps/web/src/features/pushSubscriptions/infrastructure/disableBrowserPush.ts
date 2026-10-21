import type { PushApi } from '../application/ports';
export async function disableBrowserPush(api: PushApi, csrf: string): Promise<void> {
  await api.remove(csrf);
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration || new URL(registration.scope).pathname !== '/') return;
  const sub = await registration.pushManager.getSubscription();
  if (sub && !(await sub.unsubscribe()))
    throw new Error('Đã tắt phía máy chủ nhưng chưa gỡ được đăng ký trên thiết bị. Vui lòng thử lại.');
  for (const notification of await registration.getNotifications()) notification.close();
}
