import { Link } from '@tanstack/react-router';
import { NotificationIcon } from './NotificationIcon';

export function NotificationLink() {
  return (
    <Link
      to="/notifications"
      aria-label="Cài đặt thông báo"
      title="Cài đặt thông báo"
      className="notification-link"
    >
      <NotificationIcon />
    </Link>
  );
}
