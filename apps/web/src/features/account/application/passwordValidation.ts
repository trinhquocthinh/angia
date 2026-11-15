export type PasswordValues = { password: string; confirmation: string };
export function passwordValidation(
  values: PasswordValues,
): { field: keyof PasswordValues; message: string } | null {
  if (values.password.length < 8) return { field: 'password', message: 'Mật khẩu cần ít nhất 8 ký tự.' };
  if (values.password !== values.confirmation)
    return { field: 'confirmation', message: 'Hai mật khẩu chưa khớp.' };
  return null;
}
