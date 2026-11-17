import { describe, expect, it, vi } from 'vitest';
import type { SessionRepository } from '@src/shared/auth/application/ports.js';
import type { PasswordHasher } from '@src/shared/identity/application/ports.js';
import type { RegistrationInput } from '../domain/RegistrationInput.js';
import type {
  AccountRegistrationUnitOfWork,
  CurrentLegalVersions,
  InvitationVerifier,
  LegalVersions,
  NewLocalAccountRecord,
  RegisteredLocalAccount,
  RegisterLocalAccountDeps,
  RegisterLocalAccountRecordOutcome,
  RegistrationGate,
} from './ports.js';
import { registerLocalAccount } from './registerLocalAccount.js';

const CURRENT_LEGAL: CurrentLegalVersions = {
  termsVersionId: '11111111-1111-4111-8111-111111111111',
  privacyVersionId: '22222222-2222-4222-8222-222222222222',
};

const BASE_INPUT: RegistrationInput = {
  username: 'Me.Lan',
  password: 'Password123',
  displayName: 'Mẹ Lan',
  email: 'melan@example.com',
  ageConfirmed: true,
  legalAcceptance: CURRENT_LEGAL,
};

function createFixture(
  overrides: {
    isOpen?: boolean;
    currentLegal?: CurrentLegalVersions;
    invitation?: { familyId: string; role: 'main' | 'member' } | null;
    existingUsernames?: string[];
    sessionError?: Error;
    registerFailureCode?: 'ERR_USERNAME_TAKEN';
  } = {},
) {
  const store: RegisteredLocalAccount[] = [];
  const credentials: Record<string, string> = {};
  const legalAccepted: Record<string, CurrentLegalVersions> = {};
  const sessionsCreated: Array<{ accountId: string; authMethod?: 'local' | 'oidc' }> = [];

  const gate: RegistrationGate = {
    isOpen: vi.fn(async () => overrides.isOpen ?? true),
  };
  const legalVersions: LegalVersions = {
    current: vi.fn(async () => overrides.currentLegal ?? CURRENT_LEGAL),
  };
  const invitationVerifier: InvitationVerifier = {
    verify: vi.fn(async (token: string) => {
      if (token === 'valid-invite')
        return {
          kind: 'join_family' as const,
          ...(overrides.invitation ?? { familyId: 'fam-1', role: 'member' as const }),
        };
      return null;
    }),
  };
  const hasher: PasswordHasher = {
    hash: vi.fn(async (pwd: string) => `$hashed_${pwd}`),
    verify: vi.fn(async () => true),
    needsRehash: vi.fn(() => false),
  };
  const accounts: AccountRegistrationUnitOfWork = {
    isUsernameTaken: vi.fn(async (username: string) => {
      if (overrides.existingUsernames?.includes(username)) return true;
      return store.some((acc) => acc.username === username);
    }),
    register: vi.fn(async (record: NewLocalAccountRecord): Promise<RegisterLocalAccountRecordOutcome> => {
      if (overrides.registerFailureCode) return { ok: false, code: overrides.registerFailureCode };
      const account: RegisteredLocalAccount = {
        id: `acc-${store.length + 1}`,
        username: record.usernameNormalized,
        displayName: record.displayName,
        familyId:
          record.invitationToken === 'valid-invite' ? (overrides.invitation?.familyId ?? 'fam-1') : null,
      };
      store.push(account);
      credentials[account.id] = record.passwordHash;
      legalAccepted[account.id] = record.legalAcceptance;
      return { ok: true, account };
    }),
  };
  const sessions: SessionRepository = {
    create: vi.fn(async (s) => {
      if (overrides.sessionError) throw overrides.sessionError;
      sessionsCreated.push({ accountId: s.accountId, authMethod: s.authMethod });
      return { id: `sess-${sessionsCreated.length}` };
    }),
    findActive: vi.fn(async () => null),
    extend: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  };

  const deps: RegisterLocalAccountDeps = {
    gate,
    legalVersions,
    invitationVerifier,
    hasher,
    accounts,
    sessions,
    generateToken: () => 'csrf-mock-token',
    now: () => new Date('2026-11-13T12:00:00Z'),
  };

  return { deps, store, credentials, legalAccepted, sessionsCreated };
}

describe('registerLocalAccount: use case đăng ký tài khoản local', () => {
  it('TC-736 happy: công tắc mở, tạo "Me.Lan" -> me.lan, familyId null, 2 acceptances, có phiên local', async () => {
    const { deps, store, credentials, legalAccepted, sessionsCreated } = createFixture();
    const result = await registerLocalAccount(deps, BASE_INPUT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.account).toEqual({
      id: 'acc-1',
      username: 'me.lan',
      displayName: 'Mẹ Lan',
      familyId: null,
    });
    expect(result.value.session).toEqual({
      sessionId: 'sess-1',
      csrfToken: 'csrf-mock-token',
      expiresAt: new Date('2026-12-13T12:00:00Z'),
    });
    expect(store).toHaveLength(1);
    expect(credentials['acc-1']).toBe('$hashed_Password123');
    expect(legalAccepted['acc-1']).toEqual(CURRENT_LEGAL);
    expect(sessionsCreated[0]?.authMethod).toBe('local');
  });

  it('TC-737 trùng "ME.LAN" -> ERR_USERNAME_TAKEN, không hash, không ghi store', async () => {
    const { deps, store } = createFixture({ existingUsernames: ['me.lan'] });
    const result = await registerLocalAccount(deps, { ...BASE_INPUT, username: 'ME.LAN' });

    expect(result).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
    expect(deps.accounts.register).not.toHaveBeenCalled();
    expect(store).toHaveLength(0);
  });

  it('TC-737 race: unique violation khi ghi trả ERR_USERNAME_TAKEN', async () => {
    const { deps } = createFixture({ registerFailureCode: 'ERR_USERNAME_TAKEN' });
    const result = await registerLocalAccount(deps, BASE_INPUT);
    expect(result).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
  });

  it('TC-738 không email -> tạo tài khoản thành công', async () => {
    const { deps } = createFixture();
    const payload = { ...BASE_INPUT };
    delete payload.email;
    const result = await registerLocalAccount(deps, payload);
    expect(result.ok).toBe(true);
  });

  it('TC-739 ageConfirmed false -> ERR_VALIDATION với details.field = "ageConfirmed"', async () => {
    const { deps } = createFixture();
    const result = await registerLocalAccount(deps, { ...BASE_INPUT, ageConfirmed: false });
    expect(result).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
      details: { field: 'ageConfirmed' },
    });
    expect(deps.gate.isOpen).not.toHaveBeenCalled();
  });

  it('TC-740 gate tắt, không có lời mời -> ERR_REGISTRATION_CLOSED', async () => {
    const { deps } = createFixture({ isOpen: false });
    const result = await registerLocalAccount(deps, BASE_INPUT);
    expect(result).toEqual({ ok: false, code: 'ERR_REGISTRATION_CLOSED' });
    expect(deps.accounts.register).not.toHaveBeenCalled();
  });

  it('TC-740 gate tắt, lời mời không hợp lệ -> ERR_REGISTRATION_CLOSED', async () => {
    const { deps } = createFixture({ isOpen: false });
    const result = await registerLocalAccount(deps, { ...BASE_INPUT, invitationToken: 'invalid' });
    expect(result).toEqual({ ok: false, code: 'ERR_REGISTRATION_CLOSED' });
    expect(deps.accounts.register).not.toHaveBeenCalled();
  });

  it('TC-775: chuyển token gốc vào transaction để kiểm lại và claim, không dùng membership từ snapshot', async () => {
    const { deps } = createFixture();
    await registerLocalAccount(deps, { ...BASE_INPUT, invitationToken: 'valid-invite' });
    expect(deps.accounts.register).toHaveBeenCalledWith(
      expect.objectContaining({ invitationToken: 'valid-invite' }),
    );
    expect(deps.accounts.register).not.toHaveBeenCalledWith(expect.objectContaining({ familyId: 'fam-1' }));
  });

  it('TC-741 gate tắt, có lời mời hợp lệ -> tạo thành công với familyId/role', async () => {
    const { deps, store } = createFixture({
      isOpen: false,
      invitation: { familyId: 'fam-99', role: 'main' },
    });
    const result = await registerLocalAccount(deps, { ...BASE_INPUT, invitationToken: 'valid-invite' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.account.familyId).toBe('fam-99');
    expect(store[0]?.familyId).toBe('fam-99');
  });

  it('TC-742 phiên bản Điều khoản cũ -> ERR_LEGAL_VERSION_OUTDATED kèm current', async () => {
    const { deps } = createFixture();
    const outdatedInput = {
      ...BASE_INPUT,
      legalAcceptance: {
        termsVersionId: '00000000-0000-4000-8000-000000000000',
        privacyVersionId: CURRENT_LEGAL.privacyVersionId,
      },
    };
    const result = await registerLocalAccount(deps, outdatedInput);
    expect(result).toEqual({
      ok: false,
      code: 'ERR_LEGAL_VERSION_OUTDATED',
      details: { current: CURRENT_LEGAL },
    });
    expect(deps.hasher.hash).not.toHaveBeenCalled();
    expect(deps.accounts.register).not.toHaveBeenCalled();
  });

  it('TC-742 lỗi tạo phiên sau khi commit không rollback tài khoản đã tạo', async () => {
    const failure = new Error('Lỗi DB session');
    const { deps, store } = createFixture({ sessionError: failure });

    await expect(registerLocalAccount(deps, BASE_INPUT)).rejects.toThrow(failure);
    // Tài khoản đã commit vẫn được giữ trong store
    expect(store).toHaveLength(1);
    expect(store[0]?.username).toBe('me.lan');
  });
});
