export interface PushSubscriptionValue {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
const HOSTS = new Set(['web.push.apple.com', 'fcm.googleapis.com', 'updates.push.services.mozilla.com']);
export function isAllowedPushSubscription(value: PushSubscriptionValue): boolean {
  try {
    const url = new URL(value.endpoint);
    return (
      value.endpoint.length <= 2048 &&
      url.protocol === 'https:' &&
      HOSTS.has(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.hash &&
      /^[A-Za-z0-9_-]{87}=?$/.test(value.keys.p256dh) &&
      /^[A-Za-z0-9_-]{22}={0,2}$/.test(value.keys.auth)
    );
  } catch {
    return false;
  }
}
