import { Link } from '@tanstack/react-router';

export function LoginAlternative() {
  return (
    <div className="login-alternative">
      <div className="login-divider">
        <span>Hoặc tiếp tục với</span>
      </div>
      <a className="login-authentik" href="/api/auth/login">
        <picture>
          <source media="(min-width: 1024px)" srcSet="/images/login/authentik-desktop.svg" />
          <img src="/images/login/authentik-mobile.svg" width="24" height="24" alt="" />
        </picture>
        <span>Đăng nhập bằng Authentik</span>
      </a>
      <p className="login-registration">
        Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
      </p>
    </div>
  );
}
