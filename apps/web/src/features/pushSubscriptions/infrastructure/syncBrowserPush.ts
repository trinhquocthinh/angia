import { createPushApi } from './createPushApi';
import { getPushSupport } from './getPushSupport';
export async function syncBrowserPush(csrf: string, signal: AbortSignal): Promise<void> {
  if (getPushSupport() || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration || new URL(registration.scope).pathname !== '/') return;
  const sub = await registration.pushManager.getSubscription();
  if (!sub || signal.aborted) return;
  const api = createPushApi();
  if (!(await api.config(signal)).enabled || signal.aborted) return;
  try {
    await api.register(sub.toJSON(), csrf, 'sync', signal);
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_PUSH_NOT_REGISTERED') return;
    if (!signal.aborted && (error as { code?: string }).code === 'ERR_PUSH_CONFLICT') await sub.unsubscribe();
    throw error;
  }
}
