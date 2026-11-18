/** Điểm tham khảo theo mẫu Stitch; không phải điều kiện đăng ký. */
export function assessPasswordStrength(value: string) {
  if (!value) return { score: 0, label: 'Chưa nhập' };
  const factors = [
    value.length >= 8,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  const points = factors.filter(Boolean).length;
  const score = value.length < 8 ? 1 : Math.max(1, points);
  return { score, label: ['Chưa nhập', 'Yếu', 'Trung bình', 'Khá', 'Rất mạnh'][score]! };
}
