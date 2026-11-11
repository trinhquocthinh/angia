import { z } from 'zod';
import { createAuthentikRequest, type AuthentikSpikeSettings } from './createAuthentikRequest.js';
import { createAuthentikUser } from './createAuthentikUser.js';
import { verifyAuthentikIdentity } from './verifyAuthentikIdentity.js';

const activeSchema = z.object({ pk: z.number().int().positive(), is_active: z.boolean() });
const settingsSchema = z.object({
  apiUrl: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.pathname === '/api/v3/' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  }),
  token: z.string().trim().min(1),
  groupName: z.literal('angia-sit-users'),
  flowSlug: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  timeoutMs: z.number().int().positive().default(10_000),
});

function userPath(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('idp_invalid_user_id');
  return `core/users/${id}/`;
}

// Spike E24-S1 chỉ chạy SIT; chưa nối vào luồng đăng nhập đang chạy.
export function createAuthentikIdentityProvider(input: AuthentikSpikeSettings) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) throw new Error('idp_invalid_settings');
  const settings = { ...input, ...parsed.data };
  const request = createAuthentikRequest(settings, true);
  const setActive = async (id: number, active: boolean) => {
    const result = activeSchema.safeParse(await request(userPath(id), 'PATCH', { is_active: active }));
    if (!result.success || result.data.pk !== id || result.data.is_active !== active)
      throw new Error('idp_bad_response');
  };
  return {
    createUser: (username: string, password: string) => createAuthentikUser(settings, username, password),
    verifyPassword: (username: string, password: string) =>
      verifyAuthentikIdentity(settings, username, password),
    async setPassword(id: number, password: string) {
      await request(`${userPath(id)}set_password/`, 'POST', { password });
    },
    lock: (id: number) => setActive(id, false),
    unlock: (id: number) => setActive(id, true),
    async deleteUser(id: number) {
      await request(userPath(id), 'DELETE');
    },
  };
}
