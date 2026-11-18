import type { ReactNode } from 'react';
import { LoginMobileClouds } from './LoginMobileClouds';
import { LoginClouds } from './LoginClouds';
import { LoginBrand } from './LoginBrand';
import { LoginFeatures } from './LoginFeatures';
import { LoginIcon } from './LoginIcon';
import './login-layout.css';
import './login-details.css';
import './login-form.css';
import './login-motion.css';
import './login-mobile.css';

export function LoginLayout({
  children,
  titleId = 'login-title',
}: {
  children: ReactNode;
  titleId?: string;
}) {
  return (
    <div className="login-screen">
      <img
        className="login-landscape"
        src="/images/login/family-landscape-v2.webp"
        alt=""
        width="1376"
        height="768"
        fetchPriority="high"
      />
      <LoginClouds />
      <LoginMobileClouds />
      <div className="login-shell">
        <aside className="login-brand-panel">
          <LoginBrand />
          <div className="login-intro">
            <h2>
              Chăm chút từng thói quen,
              <br />
              chở che từng thế hệ.
            </h2>
            <p>Nơi lưu giữ những điều nhỏ mỗi ngày, cùng chăm sóc sức khỏe của cả nhà.</p>
          </div>
          <div className="login-desktop-features">
            <LoginFeatures />
          </div>
          <p className="login-brand-trust">
            <LoginIcon name="shield" />
            Không gian riêng của gia đình bạn
          </p>
        </aside>
        <section className="login-form-panel" aria-labelledby={titleId}>
          {children}
        </section>
      </div>
      <footer className="login-footer">
        <LoginIcon name="shield" />
        <span>AN GIA · Cùng chăm sóc, cùng an tâm</span>
      </footer>
    </div>
  );
}
