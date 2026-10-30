import { AdminIcon } from './AdminIcon';

const BASE = 'inline-flex items-center gap-1 rounded-lg py-1 px-2 text-xs font-medium whitespace-nowrap';

// Nhãn nhóm của tài khoản; `name` null nghĩa là tài khoản chưa vào nhóm.
export function AccountFamilyBadge({ name }: { name: string | null }) {
  return name ? (
    <span className={`${BASE} bg-white text-[#004135]`}>
      <AdminIcon name="family_restroom" size={14} />
      {name}
    </span>
  ) : (
    <span className={`${BASE} bg-[#ffdbc9]/60 text-[#753400]`}>
      <AdminIcon name="pending_actions" size={14} />
      Chờ gán nhóm
    </span>
  );
}
