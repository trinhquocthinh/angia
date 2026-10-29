import { describe, expect, it } from 'vitest';
import { createMemoryProfileRepository } from '@src/shared/test/createMemoryProfileRepository.js';
import { createProfile } from './createProfile.js';
import { listProfiles } from './listProfiles.js';
const now = () => new Date('2026-10-27T00:00:00Z');
describe('TC-558 — metadata thao tác đồng thuận theo phiên main', () => {
  it.each([
    ['pending', null, null, 'attestation'],
    ['invited', null, null, 'attestation'],
    ['declined', null, null, 'attestation'],
    ['pending', 'main', null, 'self'],
    ['pending', 'other', null, 'invitation'],
    ['declined', 'other', null, 'invitation'],
    ['withdrawn', null, '2026-10-26', null],
    ['withdrawn', 'main', '2026-10-26', 'invitation'],
    ['withdrawn', 'other', '2026-10-26', 'invitation'],
    ['pending', null, '2026-10-26', null],
    ['pending', 'main', '2026-10-26', 'invitation'],
    ['confirmed', null, null, null],
  ] as const)('%s, liên kết %s, từng rút %s → %s', async (status, linked, withdrawn, action) => {
    const repo = createMemoryProfileRepository([
      { id: 'main', familyId: 'f', displayName: 'Người chăm', healthProfileId: null },
      { id: 'other', familyId: 'f', displayName: 'Người thân', healthProfileId: null },
    ]);
    const result = await createProfile(
      repo,
      'f',
      { birthYear: 1950, displayName: 'Bé An', ...(linked ? { linkedAccountId: linked } : {}) },
      now,
      'main',
    );
    if (!result.ok) throw new Error('Không tạo được fixture');
    await repo.withFamily('f', async (store) => {
      const profile = (await store.lockProfile(result.value.id))!;
      profile.consentStatus = status;
      profile.consentWithdrawnAt = withdrawn ? new Date(withdrawn) : null;
    });
    expect((await listProfiles(repo, 'f', 'main'))[0]).toMatchObject({ consentAction: action });
  });
  it('phân biệt tên người cam kết và tên người đồng ý; không lộ tên tài khoản đã rời nhóm', async () => {
    const actor = { id: 'main', familyId: 'f', displayName: 'Cha', healthProfileId: null };
    const repo = createMemoryProfileRepository([actor]);
    await createProfile(
      repo,
      'f',
      {
        birthYear: 1950,
        displayName: 'Bé',
        consent: { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: 'Mẹ' },
      },
      now,
      'main',
    );
    expect((await listProfiles(repo, 'f', 'main'))[0]).toMatchObject({
      consentConfirmedByName: 'Cha',
      consentRespondentName: 'Mẹ',
    });
    actor.familyId = 'other-family';
    expect((await listProfiles(repo, 'f', 'another-main'))[0]).toMatchObject({
      consentConfirmedByName: null,
    });
    expect(await listProfiles(repo, 'other-family', 'main')).toEqual([]);
  });
});
