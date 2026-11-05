import type { ReactNode } from 'react';

// Tiêu đề chung của các thẻ quản trị: ô icon, tên thẻ và phần phụ bên phải (số đếm, tháng, nút phụ).
export function AdminCardHeading({
  id,
  icon,
  title,
  aside,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#004135]/10 text-[#004135]">
          {icon}
        </span>
        <h2 id={id} className="m-0 text-[18px] leading-6 font-semibold text-[#131d1d]">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}
