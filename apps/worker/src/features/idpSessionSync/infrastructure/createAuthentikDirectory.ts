import { z } from 'zod';
import { IdpDirectoryError } from '../application/IdpDirectoryError.js';
import type { IdpDirectory } from '../application/ports.js';

export interface AuthentikDirectorySettings {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

// Authentik trả thêm nhiều trường (email, tên, attributes…): chỉ kiểm và giữ uid/is_active.
const groupsResponse = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      users_obj: z.array(z.object({ uid: z.string().min(1), is_active: z.boolean() })),
    }),
  ),
});

const isTimeout = (error: unknown) => error instanceof Error && error.name === 'TimeoutError';

// Timeout có thể nổ khi đang đọc body (cùng AbortSignal) → idp_timeout; JSON hỏng → undefined để zod báo bad_response.
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (isTimeout(error)) throw new IdpDirectoryError('idp_timeout');
    return undefined;
  }
}

function httpFailure(status: number): IdpDirectoryError {
  if (status === 401) return new IdpDirectoryError('idp_http_401');
  if (status === 403) return new IdpDirectoryError('idp_http_403');
  return new IdpDirectoryError('idp_http_error', status);
}

// SPEC-033: GET /api/v3/core/groups/?name=…&include_users=true bằng token chỉ đọc của service account.
// Mọi lỗi quy về mã lý do cố định; không đưa phản hồi gốc (có thể chứa định danh) vào lỗi.
export function createAuthentikDirectory(settings: AuthentikDirectorySettings): IdpDirectory {
  const doFetch = settings.fetch ?? globalThis.fetch;
  const root = settings.baseUrl.endsWith('/') ? settings.baseUrl : `${settings.baseUrl}/`;
  return {
    async fetchGroupMembers(groupName) {
      const url = new URL('api/v3/core/groups/', root);
      url.searchParams.set('name', groupName);
      url.searchParams.set('include_users', 'true');
      let response: Response;
      try {
        // redirect 'error': không mang Bearer token sang host khác nếu Authentik/proxy chuyển hướng.
        response = await doFetch(url, {
          redirect: 'error',
          headers: { Authorization: `Bearer ${settings.token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(settings.timeoutMs ?? 10_000),
        });
      } catch (error) {
        throw new IdpDirectoryError(isTimeout(error) ? 'idp_timeout' : 'idp_unreachable');
      }
      if (!response.ok) throw httpFailure(response.status);
      const parsed = groupsResponse.safeParse(await readJson(response));
      if (!parsed.success) throw new IdpDirectoryError('idp_bad_response');
      const matches = parsed.data.results.filter((group) => group.name === groupName);
      const [group] = matches;
      if (matches.length !== 1 || !group) throw new IdpDirectoryError('group_not_found');
      return group.users_obj.map((user) => ({ uid: user.uid, isActive: user.is_active }));
    },
  };
}
