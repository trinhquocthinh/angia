import { describe, expect, it, vi } from 'vitest';
import type { IdentityClaims } from '../domain/IdentityClaims.js';
import { completeLogin } from './completeLogin.js';
import type { CompleteLoginDeps, PendingLogin } from './ports.js';

const PENDING: PendingLogin = { state: 'st', codeVerifier: 'cv', nonce: 'nc' };
const NOW = new Date('2026-10-05T03:00:00.000Z');

function setup(claims: IdentityClaims) {
  const deps: CompleteLoginDeps = {
    oidc: {
      createAuthorizationRequest: vi.fn(),
      exchangeCode: vi.fn().mockResolvedValue(claims),
    },
    accounts: { upsertFromIdentity: vi.fn().mockResolvedValue({ id: 'account-1' }) },
    sessions: {
      create: vi.fn().mockResolvedValue({ id: 'session-1' }),
      findActive: vi.fn(),
      extend: vi.fn(),
      delete: vi.fn(),
    },
    adminGroupName: 'angia-admins',
    generateToken: () => 'csrf-token',
    now: () => NOW,
  };
  return deps;
}

describe('completeLogin', () => {
  it('đổi code bằng đúng tham số callback và PKCE đã lưu', async () => {
    const deps = setup({ subject: 'sub-1', name: 'Thịnh', groups: [] });
    const params = new URLSearchParams({ code: 'c', state: 'st' });
    await completeLogin(deps, params, PENDING);
    expect(deps.oidc.exchangeCode).toHaveBeenCalledWith(params, PENDING);
  });

  it('thuộc nhóm admin thì upsert is_system_admin = true, kèm tên hiển thị từ claim', async () => {
    const deps = setup({ subject: 'sub-1', name: 'Thịnh', groups: ['angia-sit-users', 'angia-admins'] });
    await completeLogin(deps, new URLSearchParams(), PENDING);
    expect(deps.accounts.upsertFromIdentity).toHaveBeenCalledWith({
      oidcSubject: 'sub-1',
      displayName: 'Thịnh',
      isSystemAdmin: true,
    });
  });

  it('không thuộc nhóm admin thì đồng bộ is_system_admin = false (thu hồi quyền khi bị gỡ khỏi nhóm)', async () => {
    const deps = setup({ subject: 'sub-1', email: 'a@b.c', groups: ['angia-sit-users'] });
    await completeLogin(deps, new URLSearchParams(), PENDING);
    expect(deps.accounts.upsertFromIdentity).toHaveBeenCalledWith({
      oidcSubject: 'sub-1',
      displayName: 'a@b.c',
      isSystemAdmin: false,
    });
  });

  it('tạo phiên cho tài khoản vừa upsert với csrf_token mới và hạn 30 ngày', async () => {
    const deps = setup({ subject: 'sub-1', groups: [] });
    const result = await completeLogin(deps, new URLSearchParams(), PENDING);
    const expiresAt = new Date('2026-11-04T03:00:00.000Z');
    expect(deps.sessions.create).toHaveBeenCalledWith({
      accountId: 'account-1',
      csrfToken: 'csrf-token',
      expiresAt,
    });
    expect(result).toEqual({ sessionId: 'session-1', expiresAt });
  });

  it('IdP từ chối đổi code thì không ghi tài khoản và không tạo phiên', async () => {
    const deps = setup({ subject: 'sub-1', groups: [] });
    vi.mocked(deps.oidc.exchangeCode).mockRejectedValue(new Error('state mismatch'));
    await expect(completeLogin(deps, new URLSearchParams(), PENDING)).rejects.toThrow('state mismatch');
    expect(deps.accounts.upsertFromIdentity).not.toHaveBeenCalled();
    expect(deps.sessions.create).not.toHaveBeenCalled();
  });
});
