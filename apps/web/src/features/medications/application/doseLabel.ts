// Liều mỗi lần của đợt thuốc; đợt từ dòng thuốc dùng ngoài có thể không ghi liều (BR-025). Chỉ mô tả (BR-033).
export function doseLabel(quantityPerDose: number | null, doseUnit: string | null): string {
  if (quantityPerDose === null) return 'Dùng theo cách ghi trên đơn';
  return `Mỗi lần ${quantityPerDose.toLocaleString('vi-VN')}${doseUnit ? ` ${doseUnit}` : ''}`;
}
