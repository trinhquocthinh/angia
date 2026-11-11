import { z } from 'zod';
import { createAuthentikRequest, type AuthentikSpikeSettings } from './createAuthentikRequest.js';

const userSchema = z.object({
  pk: z.number().int().positive(),
  uid: z.string().min(1),
  username: z.string(),
  groups: z.array(z.string().uuid()),
});
const groupsSchema = z.object({
  results: z.array(z.object({ pk: z.string().uuid(), name: z.string() })),
});

export async function createAuthentikUser(
  settings: AuthentikSpikeSettings,
  username: string,
  password: string,
) {
  const request = createAuthentikRequest(settings, true);
  const groups = groupsSchema.safeParse(
    await request(`core/groups/?name=${encodeURIComponent(settings.groupName)}`),
  );
  if (!groups.success) throw new Error('idp_bad_response');
  const matches = groups.data.results.filter((group) => group.name === settings.groupName);
  const group = matches[0];
  if (matches.length !== 1 || !group) throw new Error('idp_group_not_found');
  const result = userSchema.safeParse(
    await request('core/users/', 'POST', {
      username,
      name: 'Tài khoản thử spike',
      groups: [group.pk],
      is_active: true,
    }),
  );
  if (!result.success) throw new Error('idp_bad_response');
  const user = result.data;
  try {
    if (user.username !== username || !user.groups.includes(group.pk))
      throw new Error('idp_identity_mismatch');
    await request(`core/users/${user.pk}/set_password/`, 'POST', { password });
    return user;
  } catch (error) {
    try {
      await request(`core/users/${user.pk}/`, 'DELETE');
    } catch {
      throw new Error('idp_cleanup_failed');
    }
    throw error;
  }
}
