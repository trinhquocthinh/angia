export function LoginBrand() {
  return (
    <header className="login-brand-header">
      <div className="login-logo-tile">
        <img src="/logo.webp" width="72" height="72" alt="" />
        <span className="login-logo-heart" aria-hidden="true">
          favorite
        </span>
      </div>
      <div>
        <h1>AN GIA</h1>
        <p className="login-brand-caption">Sổ tay chăm sóc &amp; kết nối gia đình</p>
      </div>
      <p className="login-mobile-tagline">
        Chăm chút từng thói quen,
        <br />
        chở che từng thế hệ.
      </p>
    </header>
  );
}
