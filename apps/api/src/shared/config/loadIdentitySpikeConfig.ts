import { z } from 'zod';

const spikeEnvSchema = z.object({
  STACK: z.literal('sit'),
  SPIKE_AUTHENTIK_API_TOKEN: z.string().trim().min(1),
  SPIKE_AUTHENTIK_FLOW_SLUG: z.string().regex(/^[a-zA-Z0-9_-]+$/),
});

export function loadIdentitySpikeConfig(env: NodeJS.ProcessEnv) {
  const parsed = spikeEnvSchema.safeParse(env);
  if (!parsed.success) throw new Error('idp_invalid_spike_config');
  return {
    apiUrl: 'https://auth.toniboy.io.vn/api/v3/',
    token: parsed.data.SPIKE_AUTHENTIK_API_TOKEN,
    flowSlug: parsed.data.SPIKE_AUTHENTIK_FLOW_SLUG,
    groupName: 'angia-sit-users',
  };
}
