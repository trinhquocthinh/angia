import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { LoginIcon } from './LoginIcon';

type Props = ComponentPropsWithRef<'input'> & {
  label: string;
  icon: 'user' | 'key';
  trailing?: ReactNode;
};

export function LoginField({ label, icon, trailing, id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="login-field">
      <label htmlFor={inputId}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="login-input-wrap">
        <LoginIcon name={icon} />
        <input {...props} id={inputId} />
        {trailing}
      </div>
    </div>
  );
}
