import { describe, expect, it } from 'vitest';
import { acceptHouseholdInvitation } from './acceptHouseholdInvitation.js';
import { createFoundingInvitation } from './createFoundingInvitation.js';
import { revokeFoundingInvitation } from './revokeFoundingInvitation.js';
import type { FoundingInvitationActor, FoundingInvitationRepository } from './acceptancePorts.js';

const issued = {
  invitationId: 'lời mời',
  token: 'bí mật',
  code: 'ABC123456789',
  expiresAt: new Date('2026-11-24T00:00:00Z'),
};
const admin: FoundingInvitationActor = { accountId: 'quản trị', isSystemAdmin: true, authMethod: 'oidc' };

function repositoryFixture() {
  const pending = new Set<string>();
  const repository: FoundingInvitationRepository = {
    create: async () => {
      pending.add(issued.invitationId);
      return { ok: true, value: issued };
    },
    revoke: async (_actor, id) => (pending.delete(id) ? { ok: true } : { ok: false, code: 'ERR_NOT_FOUND' }),
  };
  return { pending, repository };
}

describe('Ứng dụng xác nhận và lời mời lập nhà', () => {
  it('TC-775: giữ kết quả transaction xác nhận, không tạo membership riêng', async () => {
    expect(
      await acceptHouseholdInvitation(
        { accept: async () => ({ ok: true, familyId: 'nhà' }) },
        'người nhận',
        'token',
      ),
    ).toEqual({ ok: true, familyId: 'nhà' });
    expect(
      await acceptHouseholdInvitation(
        { accept: async () => ({ ok: false, code: 'ERR_DELETION_PENDING' }) },
        'người nhận',
        'token',
      ),
    ).toEqual({ ok: false, code: 'ERR_DELETION_PENDING' });
  });
  it('TC-779: admin phát hành link fragment rồi thu hồi một lần', async () => {
    const { repository, pending } = repositoryFixture();
    expect(await createFoundingInvitation(repository, admin, 'https://angia.example/')).toEqual({
      ok: true,
      value: {
        invitationId: issued.invitationId,
        link: `https://angia.example/invite#token=${encodeURIComponent(issued.token)}`,
        code: issued.code,
        expiresAt: issued.expiresAt,
      },
    });
    expect(pending.size).toBe(1);
    expect(await revokeFoundingInvitation(repository, admin, issued.invitationId)).toEqual({ ok: true });
    expect(pending.size).toBe(0);
    expect(await revokeFoundingInvitation(repository, admin, issued.invitationId)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it.each([
    { ...admin, authMethod: 'local' as const },
    { ...admin, isSystemAdmin: false },
  ])('TC-780: từ chối người thường hoặc phiên local %#', async (actor) => {
    const { repository, pending } = repositoryFixture();
    expect(await createFoundingInvitation(repository, actor, 'https://angia.example')).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(pending.size).toBe(0);
    await repository.create(admin.accountId);
    expect(await revokeFoundingInvitation(repository, actor, issued.invitationId)).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(pending.size).toBe(1);
  });
  it('TC-780: quyền admin mất tại DB giữ lỗi từ kho', async () => {
    const { repository } = repositoryFixture();
    expect(
      await createFoundingInvitation(
        { ...repository, create: async () => ({ ok: false, code: 'ERR_FORBIDDEN' }) },
        admin,
        'https://angia.example',
      ),
    ).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
  });
});
