// Cùng quy tắc đăng ký: giữ nguyên cách so sánh, không trim mật khẩu.
export function validateNewPassword(password: string, usernameNormalized: string): boolean {
  return password.length >= 8 && password.length <= 1024 && password.toLowerCase() !== usernameNormalized;
}
