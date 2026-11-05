import { AdminIcon, type AdminIconName } from '@src/features/family/presentation/components/AdminIcon';

// Mục menu cho tính năng chưa có trang: giữ chỗ theo thiết kế, luôn vô hiệu.
export function SoonMenuItem({
  icon,
  label,
  className,
}: {
  icon: AdminIconName;
  label: string;
  className: string;
}) {
  return (
    <button type="button" disabled title="Sắp ra mắt" className={className}>
      <span className="text-[#404945]">
        <AdminIcon name={icon} />
      </span>
      {label}
    </button>
  );
}
