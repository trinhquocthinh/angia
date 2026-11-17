import { assessPasswordStrength } from './assessPasswordStrength';

export function PasswordStrength({ value }: { value: string }) {
  const { score, label } = assessPasswordStrength(value);
  return (
    <div
      className="registration-strength"
      data-score={score}
      role="meter"
      aria-label="Độ mạnh mật khẩu"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={score}
      aria-valuetext={label}
    >
      <div className="registration-strength-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} />
        ))}
      </div>
      <p>
        Độ mạnh: <strong>{label}</strong>
      </p>
    </div>
  );
}
