export type NotificationPermissionState = NotificationPermission | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}
