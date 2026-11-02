import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

// Lối vào tự xem cho mọi tài khoản đã liên kết, kể cả main (Design §9.1).
export function SelfProfileMenuItem({ className }: { className: string }) {
  return (
    <Link to="/my-profile" className={className}>
      <span className="text-[#20594b]">
        <AdminIcon name="person" />
      </span>
      Hồ sơ của tôi
    </Link>
  );
}
