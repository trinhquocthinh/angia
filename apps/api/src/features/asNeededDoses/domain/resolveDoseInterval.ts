import type { DoseInterval } from './AsNeededDose.js';

// BR-054: giá trị in trên đơn được ưu tiên; không có nguồn nào thì không hiển thị (không mặc định).
export function resolveDoseInterval(
  prescriptionText: string | null,
  userText: string | null,
): DoseInterval | null {
  if (prescriptionText) return { text: prescriptionText, source: 'prescription' };
  return userText ? { text: userText, source: 'user' } : null;
}
