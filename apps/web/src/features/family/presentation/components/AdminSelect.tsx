import type { SelectHTMLAttributes } from 'react';

// Mũi tên và khoảng đệm phải dùng quy tắc `select` chung tại app/styles.css.
export function AdminSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className="min-h-10 w-full min-w-0 rounded-xl border-0 bg-accent-soft py-2 pl-3 text-[13px] leading-5 font-normal text-text-primary transition-colors focus:bg-accent-soft disabled:opacity-65"
      >
        {children}
      </select>
    </div>
  );
}
