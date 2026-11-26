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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          {icon}
        </span>
        <h2 id={id} className="auth-heading m-0 text-heading-2 font-semibold text-accent">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}
