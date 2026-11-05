import { z } from 'zod';
import type { RecordTemperatureRequest } from '@angia/contracts';

export type TemperatureFormValues = { celsius: string; measuredAt: string };

// Giữ số nhập gốc: API làm tròn thập phân trước khi kiểm khoảng cần xác nhận.
export function temperatureFormSchema(now = new Date()) {
  return z
    .object({
      celsius: z
        .string()
        .trim()
        .refine((value) => {
          const number = Number(value.replace(',', '.'));
          return /^\d+([.,]\d+)?$/.test(value) && number >= 25 && number <= 50;
        }, 'Nhập nhiệt độ từ 25,0 đến 50,0 °C; ví dụ 38,5.'),
      measuredAt: z.string().refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
        const time = Date.parse(`${value}+07:00`);
        return (
          Number.isFinite(time) &&
          time <= now.getTime() &&
          new Date(time + 7 * 3_600_000).toISOString().slice(0, 16) === value
        );
      }, 'Nhập ngày giờ hợp lệ theo giờ Việt Nam, không ở tương lai.'),
    })
    .transform((values): RecordTemperatureRequest => ({
      celsius: Number(values.celsius.replace(',', '.')),
      measuredAt: new Date(`${values.measuredAt}+07:00`).toISOString(),
      confirmOutOfRange: false,
    }));
}
