export async function clearBrowserPushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration || new URL(registration.scope).pathname !== '/') return;
  await (await registration.pushManager.getSubscription())?.unsubscribe();
  for (const notification of await registration.getNotifications()) notification.close();
}
