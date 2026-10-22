import type { ReactNode } from 'react';
import { PushIcon, type PushIconName } from './PushIcon';

export function PushNote({
  icon,
  title,
  className = '',
  children,
}: {
  icon: PushIconName;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex items-start gap-3 rounded-[20px] p-4 lg:gap-4 lg:p-6 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#aef0da] text-[#055141] lg:h-11 lg:w-11 lg:rounded-xl lg:bg-[#e4f0f0] lg:text-[#004135]">
        <PushIcon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="mb-1 text-base font-semibold text-[#131d1d]">{title}</h2>
        <div className="text-sm leading-relaxed text-[#404945]">{children}</div>
      </div>
    </section>
  );
}
