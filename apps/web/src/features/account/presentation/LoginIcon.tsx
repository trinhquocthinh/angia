import { loginIcons } from './loginIconPaths';

export function LoginIcon({ name }: { name: keyof typeof loginIcons }) {
  const icon = loginIcons[name];
  return (
    <span className="login-icon" aria-hidden="true">
      <svg
        className="login-icon-desktop"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={icon.path} />
      </svg>
      <span className="login-icon-mobile">{icon.symbol}</span>
    </span>
  );
}
