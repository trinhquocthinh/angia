import { useId, useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { Field } from '@src/shared/ui/field/Field';
type Props = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};
export function PasswordField({ id, ...props }: Props) {
  const generatedId = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Field
        {...props}
        id={id ?? generatedId}
        type={visible ? 'text' : 'password'}
        className={`pr-14 ${props.className ?? ''}`}
      />
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        className="absolute top-8 right-1 flex h-12 w-12 items-center justify-center rounded-xl text-text-secondary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  );
}
