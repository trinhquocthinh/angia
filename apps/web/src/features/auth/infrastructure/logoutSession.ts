import { apiClient } from '@src/shared/api/apiClient';

export async function logoutSession(csrfToken: string, client = apiClient): Promise<void> {
  if (!csrfToken) throw new Error('Không thể đăng xuất. Vui lòng thử lại.');
  const { response } = await client.POST('/api/auth/logout', { headers: { 'X-CSRF-Token': csrfToken } });
  if (response.status !== 401 && !response.ok) throw new Error('Không thể đăng xuất. Vui lòng thử lại.');
}
