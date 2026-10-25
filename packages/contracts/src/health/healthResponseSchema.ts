import { z } from 'zod';

// Trạng thái của từng phụ thuộc hạ tầng mà /api/health thăm dò.
const dependencyStatusSchema = z.enum(['ok', 'down']);

export const healthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    db: dependencyStatusSchema,
    storage: dependencyStatusSchema,
  })
  .meta({ id: 'HealthResponse' });

export type HealthResponse = z.infer<typeof healthResponseSchema>;
