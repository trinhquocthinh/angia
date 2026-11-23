import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { expect, it } from 'vitest';
import type { PasswordValues } from '../application/passwordValidation';
import { NewPasswordFields } from './NewPasswordFields';

function Fields({ strength = false }: { strength?: boolean }) {
  const form = useForm<PasswordValues>({ defaultValues: { password: '', confirmation: '' } });
  return <NewPasswordFields form={form} showStrength={strength} />;
}

it('TC-749: đổi mật khẩu và enrollment giữ hai trường trực tiếp, không bật meter mặc định', () => {
  const html = renderToStaticMarkup(<Fields />);
  expect(html).toMatch(/^<div class="relative">/);
  expect(html.match(/autoComplete="new-password"/g)).toHaveLength(2);
  expect(html).not.toContain('role="meter"');
});

it('TC-764: đặt lại mật khẩu bật meter dùng chung và không render giá trị mật khẩu', () => {
  const html = renderToStaticMarkup(<Fields strength />);
  expect(html).toContain('role="meter"');
  expect(html).toContain('aria-label="Độ mạnh mật khẩu"');
  expect(html).not.toContain('value=');
});
