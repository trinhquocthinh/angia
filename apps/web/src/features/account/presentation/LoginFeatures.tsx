import { LoginIcon } from './LoginIcon';

const features = [
  {
    icon: 'medication',
    title: 'Lịch uống & Nhắc nhở chu đáo',
    description: 'Nhắc đúng giờ, an tâm cho cả nhà',
  },
  { icon: 'heart', title: 'Nhật ký chỉ số & Thể trạng', description: 'Ghi lại thay đổi, hiểu thêm về mình' },
  {
    icon: 'family',
    title: 'Gắn kết yêu thương đa thế hệ',
    description: 'Cùng quan tâm ông bà, cha mẹ và con',
  },
] as const;

export function LoginFeatures() {
  return (
    <ul className="login-features" aria-label="Tiện ích AN GIA">
      {features.map(({ icon, title, description }) => (
        <li key={icon} className={`login-feature login-feature-${icon}`}>
          <span className="login-feature-icon">
            <LoginIcon name={icon} />
          </span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
