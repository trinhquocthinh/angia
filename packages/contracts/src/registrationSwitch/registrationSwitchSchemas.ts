import { z } from 'zod';

export const updateRegistrationSwitchRequestSchema = z
  .object({ open: z.boolean() })
  .meta({ id: 'UpdateRegistrationSwitchRequest' });
export const registrationSwitchResponseSchema = z
  .object({ registrationOpen: z.boolean() })
  .meta({ id: 'RegistrationSwitchResponse' });

export type UpdateRegistrationSwitchRequest = z.infer<typeof updateRegistrationSwitchRequestSchema>;
export type RegistrationSwitchResponse = z.infer<typeof registrationSwitchResponseSchema>;
