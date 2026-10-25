import { z } from 'zod';

const measurementSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    durationMs: z.number(),
    maxRssMb: z.number(),
    width: z.number().int(),
    height: z.number().int(),
    outputBytes: z.number().int(),
  }),
  z.object({ ok: z.literal(false), durationMs: z.number(), maxRssMb: z.number(), error: z.string() }),
]);

export type Measurement = z.infer<typeof measurementSchema>;

/** Kết quả đo là dòng JSON cuối mà `measureOne.ts` in ra; dòng trước đó có thể là log của thư viện. */
export const parseMeasurement = (stdout: string): Measurement => {
  const lastLine = stdout.trim().split('\n').pop()?.trim();
  if (!lastLine) throw new Error('Tiến trình đo không có kết quả');

  const parsed = measurementSchema.safeParse(JSON.parse(lastLine));
  if (!parsed.success) throw new Error(`Kết quả đo sai cấu trúc — ${parsed.error.message}`);
  return parsed.data;
};
