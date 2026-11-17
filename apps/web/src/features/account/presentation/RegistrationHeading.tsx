export function RegistrationHeading() {
  return (
    <div className="login-form-heading">
      <span className="login-heading-icon">
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </span>
      <div>
        <h2 id="register-title">Tạo tài khoản</h2>
        <p>Bắt đầu sổ tay chăm sóc gia đình mình.</p>
      </div>
    </div>
  );
}
