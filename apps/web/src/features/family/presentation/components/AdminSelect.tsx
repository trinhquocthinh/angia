import type { SelectHTMLAttributes } from 'react';

// Mũi tên và khoảng đệm phải dùng quy tắc `select` chung tại app/styles.css.
export function AdminSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className="min-h-10 w-full min-w-0 rounded-xl border-0 bg-[#eaf6f5] py-2 pl-3 text-[13px] leading-5 font-normal text-[#131d1d] transition-colors focus:bg-[#e4f0f0] disabled:opacity-65"
      >
        {children}
      </select>
    </div>
  );
}
