/** Chuỗi tiền đã qua schema, giữ toàn bộ phần thập phân, không qua Number/float. */
export function formatBillingUsd(amount: string): string {
  const [whole = '0', decimals = ''] = amount.split('.');
  const fraction = decimals.replace(/0+$/, '') || '00';
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction} USD`;
}
