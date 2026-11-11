import type { ComponentPropsWithRef } from 'react';

type NativeProps = ComponentPropsWithRef<'button'>;
type Props = NativeProps &
  ({ variant?: 'primary' | 'secondary' } | { variant: 'icon'; 'aria-label': string });

const VARIANTS = {
  primary: 'min-h-14 rounded-xl bg-accent text-xl leading-7 text-on-accent hover:bg-accent-hover',
  secondary:
    'min-h-12 rounded-xl border border-border bg-surface text-lg leading-6 text-text-secondary hover:bg-accent-soft hover:text-text-primary',
  icon: 'min-h-12 w-12 shrink-0 rounded-full bg-accent-soft text-lg leading-6 text-text-secondary hover:bg-border hover:text-text-primary',
};

/** Mặc định là nút thường; caller chọn submit rõ ràng để tránh gửi form ngoài ý muốn. */
export function Button({ variant = 'primary', type = 'button', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-w-12 items-center justify-center gap-2 px-4 py-2 font-sans font-semibold break-words transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none ${VARIANTS[variant]} ${className}`}
    />
  );
}
