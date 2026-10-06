import type { SelectHTMLAttributes } from 'react';
import { AdminIcon } from './AdminIcon';

export function AdminSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className="min-h-10 w-full min-w-0 appearance-none rounded-xl border-0 bg-[#eaf6f5] py-2 pr-10 pl-3 text-[13px] leading-5 font-normal text-[#131d1d] transition-colors focus:bg-[#e4f0f0] disabled:opacity-65"
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center text-[#404945]"
        aria-hidden="true"
      >
        <AdminIcon name="expand_more" size={18} />
      </span>
    </div>
  );
}
