// Số tiền thập phân → đơn vị 10^-12 USD bằng BigInt, không qua Number.
export const USD_SCALE = 1_000_000_000_000n;
export const usdUnits = (value: string): bigint => {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * USD_SCALE + BigInt(fraction.padEnd(12, '0').slice(0, 12));
};
