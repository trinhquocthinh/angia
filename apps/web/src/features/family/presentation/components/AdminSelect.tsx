import type { SelectHTMLAttributes } from 'react';

// Mũi tên và khoảng đệm phải dùng quy tắc `select` chung tại app/styles.css.
export function AdminSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className="min-h-11 w-full min-w-0 rounded-2xl border border-border/45 bg-bg py-2 pl-3.5 text-body font-normal text-text-primary transition-colors focus:bg-surface disabled:opacity-65"
      >
        {children}
      </select>
    </div>
  );
}
