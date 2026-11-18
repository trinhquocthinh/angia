import { Link } from '@tanstack/react-router';

export function RegistrationFooter() {
  return (
    <p className="login-registration">
      Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
    </p>
  );
}
