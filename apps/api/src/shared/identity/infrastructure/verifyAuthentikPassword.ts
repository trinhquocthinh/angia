import { z } from 'zod';
import { createAuthentikRequest, type AuthentikSpikeSettings } from './createAuthentikRequest.js';

const challengeSchema = z.object({
  component: z.string(),
  password_fields: z.boolean().optional(),
  response_errors: z.record(z.string(), z.unknown()).optional(),
});
const meSchema = z.object({
  user: z.object({ uid: z.string().min(1), username: z.string(), is_active: z.boolean() }),
});

// shortcut: chỉ nhận diện/mật khẩu; stage MFA, captcha hoặc consent cần đánh giá lại sau spike A23.
export async function verifyAuthentikPassword(
  settings: AuthentikSpikeSettings,
  username: string,
  password: string,
): Promise<string> {
  const request = createAuthentikRequest(settings, false);
  const path = `flows/executor/${encodeURIComponent(settings.flowSlug)}/`;
  let response = await request(path);
  let passwordSubmitted = false;
  for (let step = 0; step < 10; step++) {
    const parsed = challengeSchema.safeParse(response);
    if (!parsed.success) throw new Error('idp_bad_response');
    const { component, response_errors: errors, password_fields: combined } = parsed.data;
    if (errors && Object.keys(errors).length) throw new Error('idp_invalid_credentials');
    if (component === 'xak-flow-redirect') {
      if (!passwordSubmitted) throw new Error('idp_unverified_flow');
      const me = meSchema.safeParse(await request('core/users/me/'));
      if (!me.success) throw new Error('idp_bad_response');
      if (me.data.user.username !== username || !me.data.user.is_active) {
        throw new Error('idp_identity_mismatch');
      }
      return me.data.user.uid;
    }
    if (component === 'ak-stage-access-denied') throw new Error('idp_access_denied');
    if (component === 'ak-stage-identification') {
      response = await request(path, 'POST', {
        component,
        uid_field: username,
        ...(combined ? { password } : {}),
      });
      passwordSubmitted ||= combined === true;
    } else if (component === 'ak-stage-password') {
      passwordSubmitted = true;
      response = await request(path, 'POST', { component, password });
    } else {
      throw new Error('idp_unsupported_stage');
    }
  }
  throw new Error('idp_flow_limit');
}
