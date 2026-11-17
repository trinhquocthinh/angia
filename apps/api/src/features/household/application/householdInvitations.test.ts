import { describe, expect, it } from 'vitest';
import { createHouseholdInvitation } from './createHouseholdInvitation.js';
import { revokeHouseholdInvitation } from './revokeHouseholdInvitation.js';
import type { HouseholdInvitationRepository, InvitationActor } from './invitationPorts.js';

const actor: InvitationActor = { accountId: 'người mời', familyId: 'nhà', role: 'main' };
const invitation = {
  invitationId: 'lời mời',
  token: 'secret token',
  code: 'A123456789BC',
  expiresAt: new Date('2026-11-24T00:00:00Z'),
};
const repository: HouseholdInvitationRepository = {
  create: async () => ({ ok: true, value: invitation }),
  revoke: async () => ({ ok: true }),
};
const deps = { repository, appBaseUrl: 'https://angia.example/' };

describe('Ứng dụng lời mời vào nhà', () => {
  it('TC-773: trả link fragment và không lộ token riêng trong DTO', async () => {
    expect(await createHouseholdInvitation(deps, actor, { kind: 'join_family', role: 'member' })).toEqual({
      ok: true,
      value: {
        invitationId: 'lời mời',
        link: 'https://angia.example/invite#token=secret%20token',
        code: invitation.code,
        expiresAt: invitation.expiresAt,
      },
    });
  });
  it.each([
    { ...actor, role: 'member' as const },
    { ...actor, familyId: null },
  ])('TC-774: chặn phát hành khi không phải main có nhà %#', async (user) => {
    expect(await createHouseholdInvitation(deps, user, { kind: 'join_family', role: 'member' })).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
  });
  it('TC-781: giữ lỗi nhà chờ xoá từ transaction', async () => {
    const blocked: HouseholdInvitationRepository = {
      ...repository,
      create: async () => ({ ok: false, code: 'ERR_DELETION_PENDING' }),
    };
    expect(
      await createHouseholdInvitation({ ...deps, repository: blocked }, actor, {
        kind: 'join_family',
        role: 'main',
      }),
    ).toEqual({ ok: false, code: 'ERR_DELETION_PENDING' });
  });
  it('TC-872: chưa có nhà không thu hồi được lời mời', async () => {
    expect(await revokeHouseholdInvitation(repository, { ...actor, familyId: null }, 'lời mời')).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
  });
  it('người tạo member được chuyển tới kiểm quyền trong transaction', async () => {
    expect(await revokeHouseholdInvitation(repository, { ...actor, role: 'member' }, 'lời mời')).toEqual({
      ok: true,
    });
  });
});
