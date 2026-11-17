import { useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { LoginField } from './LoginField';
import { LoginIcon } from './LoginIcon';

export function LoginPasswordField(props: Omit<ComponentPropsWithRef<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <LoginField
      {...props}
      label="Mật khẩu"
      icon="key"
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          className="login-password-toggle"
        >
          <LoginIcon name={visible ? 'hidden' : 'eye'} />
        </button>
      }
    />
  );
}
