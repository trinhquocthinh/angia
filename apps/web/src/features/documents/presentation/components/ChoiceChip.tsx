import type { ReactNode } from 'react';
export function ChoiceChip({
  selected,
  disabled,
  onClick,
  children,
  tone = 'primary',
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: 'primary' | 'container';
}) {
  const active = tone === 'primary' ? 'bg-[#004135] text-white' : 'bg-[#20594b] text-white';
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? `${active} shadow-sm`
          : 'bg-[#e4f0f0] text-[#404945] enabled:hover:bg-[#deebea] enabled:hover:text-[#131d1d]'
      }`}
    >
      {children}
    </button>
  );
}
