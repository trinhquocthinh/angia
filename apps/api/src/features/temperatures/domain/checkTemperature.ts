export type TemperatureCheck =
  { ok: true; celsius: number } | { ok: false; code: 'ERR_OUT_OF_RANGE_UNCONFIRMED'; fields: ['celsius'] };

const PLAUSIBLE = { min: 34, max: 43 };

// Làm tròn thập phân qua ký pháp mũ để 38,45 thành 38,5 (38.45 * 10 trong số thực ra 384,4999…).
const toTenth = (value: number) => Number(`${Math.round(Number(`${value}e1`))}e-1`);

// BR-055: khoảng khả dĩ kiểm trên giá trị đã làm tròn; chỉ là xác nhận chủ đích (BR-021), không phân loại sốt.
export function checkTemperature(celsius: number, confirmOutOfRange: boolean): TemperatureCheck {
  const rounded = toTenth(celsius);
  if (!confirmOutOfRange && (rounded < PLAUSIBLE.min || rounded > PLAUSIBLE.max))
    return { ok: false, code: 'ERR_OUT_OF_RANGE_UNCONFIRMED', fields: ['celsius'] };
  return { ok: true, celsius: rounded };
}
