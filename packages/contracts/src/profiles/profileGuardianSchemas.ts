import { z } from 'zod';
export const addProfileGuardianRequestSchema = z.object({ guardianAccountId: z.uuid() }).strict();
