export interface AuthentikSpikeSettings {
  apiUrl: string;
  token: string;
  groupName: string;
  flowSlug: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

// Cookie jar chỉ dành cho một lần kiểm mật khẩu, cùng origin và cùng executor.
export function createAuthentikRequest(settings: AuthentikSpikeSettings, authenticated: boolean) {
  const cookies = new Map<string, string>();
  const deadline = authenticated ? undefined : AbortSignal.timeout(settings.timeoutMs ?? 10_000);
  return async (path: string, method = 'GET', body?: unknown): Promise<unknown> => {
    const url = new URL(path, settings.apiUrl);
    const signal = deadline ?? AbortSignal.timeout(settings.timeoutMs ?? 10_000);
    for (let redirects = 0; redirects < 10; redirects++) {
      const headers = new Headers({ Accept: 'application/json' });
      if (authenticated) headers.set('Authorization', `Bearer ${settings.token}`);
      if (cookies.size) headers.set('Cookie', [...cookies].map(([k, v]) => `${k}=${v}`).join('; '));
      if (cookies.has('authentik_csrf')) headers.set('X-authentik-CSRF', cookies.get('authentik_csrf')!);
      if (body !== undefined) headers.set('Content-Type', 'application/json');
      headers.set('Referer', url.href);
      try {
        const response = await (settings.fetch ?? globalThis.fetch)(url, {
          method,
          headers,
          redirect: 'manual',
          signal,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        if (!authenticated) {
          for (const cookie of response.headers.getSetCookie()) {
            const pair = cookie.split(';')[0]!;
            const separator = pair.indexOf('=');
            if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
          }
        }
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('Location');
          const target = location ? new URL(location, url) : undefined;
          if (authenticated || !target || target.href !== url.href || ![302, 303].includes(response.status)) {
            throw new Error('idp_unsafe_redirect');
          }
          method = 'GET';
          body = undefined;
          continue;
        }
        if (!response.ok) throw new Error(`idp_http_${response.status}`);
        if (response.status === 204) return undefined;
        try {
          return await response.json();
        } catch (error) {
          if (signal.aborted) throw error;
          throw new Error('idp_bad_response');
        }
      } catch (error) {
        if (signal.aborted || (error instanceof Error && error.name === 'TimeoutError'))
          throw new Error('idp_timeout');
        if (error instanceof Error && /^idp_[a-z_0-9]+$/.test(error.message)) throw error;
        throw new Error('idp_unreachable');
      }
    }
    throw new Error('idp_flow_limit');
  };
}
