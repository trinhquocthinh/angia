type ResetIconName =
  | 'member-reset-key'
  | 'member-reset-lock'
  | 'member-reset-check-circle'
  | 'member-reset-copy'
  | 'member-reset-alert-circle'
  | 'member-reset-warning';

/** Icon đơn sắc trích từ Stitch dùng CSS mask để nhận đúng màu chữ ở nền sáng và tối. */
export function MemberResetIcon({ name, size }: { name: ResetIconName; size: number }) {
  const source = `url('/images/household/stitch/${name}.svg')`;
  return (
    <span
      className="member-reset-icon"
      aria-hidden="true"
      style={{ width: size, height: size, maskImage: source, WebkitMaskImage: source }}
    />
  );
}
