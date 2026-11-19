import './login-clay-icons.css';

type IconName = 'lock' | 'user' | 'key' | 'medication' | 'heart' | 'family';

// Hai bộ SVG gốc Stitch được lưu cùng miền, chọn ảnh theo breakpoint hiện hành.
export function LoginClayIcon({ name }: { name: IconName }) {
  const mobile = ['lock', 'user', 'key'].includes(name) ? 'mobile' : 'desktop';
  return (
    <picture className={`login-icon login-clay-icon login-clay-icon-${name}`} aria-hidden="true">
      <source media="(min-width: 1024px)" srcSet={`/images/login/clay/desktop-${name}.svg`} />
      <img src={`/images/login/clay/${mobile}-${name}.svg`} width="24" height="24" alt="" />
    </picture>
  );
}
