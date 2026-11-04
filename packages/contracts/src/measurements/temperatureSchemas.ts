import { z } from 'zod';

const MAX_RANGE_DAYS = 366;
const daySpan = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;

// SPEC-048: 25,0–50,0 là lưới an toàn (cùng CHECK DB); khoảng 34,0–43,0 kèm xác nhận kiểm ở application (BR-055).
export const recordTemperatureRequestSchema = z
  .strictObject({
    celsius: z.number().min(25).max(50),
    measuredAt: z.iso.datetime({ offset: true }),
    confirmOutOfRange: z.boolean().default(false),
  })
  .meta({ id: 'RecordTemperatureRequest' });
export type RecordTemperatureRequest = z.infer<typeof recordTemperatureRequestSchema>;

// Chỉ dữ liệu đo; không phân loại sốt, không nhãn hay màu theo mức (BR-033, BR-055).
export const temperatureReadingSchema = z
  .object({
    id: z.uuid(),
    celsius: z.number(),
    measuredAt: z.iso.datetime(),
    recordedBy: z.uuid().nullable(),
    recordedAt: z.iso.datetime(),
  })
  .meta({ id: 'TemperatureReading' });
export type TemperatureReading = z.infer<typeof temperatureReadingSchema>;

// Ngày theo giờ Việt Nam, tính cả hai đầu, tối đa 366 ngày.
export const temperatureQuerySchema = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine(({ from, to }) => from <= to && daySpan(from, to) <= MAX_RANGE_DAYS, {
    message: `Khoảng thời gian phải từ 1 đến ${MAX_RANGE_DAYS} ngày`,
    path: ['to'],
  });

export const temperatureListSchema = z
  .object({ readings: z.array(temperatureReadingSchema) })
  .meta({ id: 'TemperatureList' });
export type TemperatureList = z.infer<typeof temperatureListSchema>;
