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
      className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow,scale] duration-200 ease-out enabled:cursor-pointer enabled:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:enabled:active:scale-100 ${
        selected
          ? `${active} shadow-sm`
          : 'bg-[#e4f0f0] text-[#404945] enabled:hover:bg-[#deebea] enabled:hover:text-[#131d1d]'
      }`}
    >
      {children}
    </button>
  );
}
