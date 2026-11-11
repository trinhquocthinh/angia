import type { ReactNode } from 'react';
export function ChoiceChip({
  selected,
  disabled,
  onClick,
  children,
  tone = 'primary',
  segment = false,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: 'primary' | 'container';
  /** Ô trong lưới (buổi dùng): bo vừa, chữ căn giữa, co theo lưới thay vì theo chữ. */
  segment?: boolean;
}) {
  const active = tone === 'primary' ? 'bg-accent text-on-accent' : 'bg-accent text-on-accent';
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-1.5 py-2 text-sm font-medium transition-[background-color,color,box-shadow,scale] duration-200 ease-out enabled:cursor-pointer enabled:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:enabled:active:scale-100 ${segment ? 'justify-center rounded-xl px-1' : 'rounded-full px-4'} ${
        selected
          ? `${active} shadow-sm`
          : 'bg-accent-soft text-text-secondary enabled:hover:bg-border enabled:hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}
