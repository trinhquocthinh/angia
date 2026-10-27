const scaled = (value: string): bigint => {
  if (!/^\d+(?:\.\d{1,12})?$/.test(value)) throw new Error('billing_invalid_decimal');
  const [whole = '0', fraction = ''] = value.split('.');
  return BigInt(whole) * 10n ** 12n + BigInt(fraction.padEnd(12, '0'));
};
export function reconcileCounter(previous: string | null, current: string, imported: string) {
  const counter = scaled(current);
  if (previous !== null && counter < scaled(previous)) return 'counter_reset';
  return counter === scaled(imported) ? 'complete' : 'gap';
}
