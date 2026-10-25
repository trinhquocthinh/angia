import type { InputHTMLAttributes, ReactNode } from 'react';

type SwitchFieldProps = InputHTMLAttributes<HTMLInputElement> & { children: ReactNode; className?: string };

// Công tắc bật/tắt dạng nhãn bấm được (vùng chạm ≥ 48px); dùng cho "Dài hạn" và "Thuốc bôi / dùng ngoài".
export function SwitchField({ children, className = '', ...input }: SwitchFieldProps) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-[#eaf6f5] px-4 text-sm font-medium text-[#3f4946] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#286958] ${className}`}
    >
      <input type="checkbox" role="switch" className="peer sr-only" {...input} />
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-full bg-[#bfc9c4] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#004135] peer-checked:after:translate-x-4"
      />
      {children}
    </label>
  );
}
