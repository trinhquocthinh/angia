import { z } from 'zod';
import { createAuthentikRequest, type AuthentikSpikeSettings } from './createAuthentikRequest.js';
import { verifyAuthentikPassword } from './verifyAuthentikPassword.js';

const usersSchema = z.object({
  results: z.array(z.object({ username: z.string(), is_active: z.boolean() })),
});

export async function verifyAuthentikIdentity(
  settings: AuthentikSpikeSettings,
  username: string,
  password: string,
) {
  try {
    return await verifyAuthentikPassword(settings, username, password);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !['idp_invalid_credentials', 'idp_access_denied'].includes(error.message)
    )
      throw error;
    // Chỉ phân loại sau khi flow đã từ chối; không dùng trạng thái khoá thay cho thử đăng nhập thật.
    const request = createAuthentikRequest(settings, true);
    const query = new URLSearchParams({ username, groups_by_name: settings.groupName });
    const users = usersSchema.safeParse(await request(`core/users/?${query}`));
    if (!users.success) throw new Error('idp_bad_response');
    const matches = users.data.results.filter((user) => user.username === username);
    if (matches.length === 1 && matches[0]?.is_active === false) throw new Error('ERR_ACCOUNT_LOCKED');
    throw error;
  }
}
