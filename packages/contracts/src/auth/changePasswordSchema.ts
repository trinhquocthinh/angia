import { z } from 'zod';

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1).max(1024).optional(),
    newPassword: z.string().min(1).max(1024),
  })
  .meta({ id: 'ChangePasswordRequest' });
