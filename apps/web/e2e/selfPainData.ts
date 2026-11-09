import type { SelfProfile } from '@angia/contracts';
import { painIssueDetailSchema } from '@angia/contracts';
import { issue } from './painJournalFixture.js';
const actor = { accountId: '00000000-0000-4000-8000-000000000003', displayName: 'Người ghi thử' };
const profileId = '00000000-0000-4000-8000-000000000002';
export function selfPainData(role: 'main' | 'member') {
  const detail = painIssueDetailSchema.parse({
    ...issue,
    entryCount: 1,
    exercises: [],
    statusEvents: [],
    entries: [
      {
        id: issue.id,
        level: 6,
        recordedAt: issue.lastEntry.recordedAt,
        note: null,
        createdBy: actor,
        updatedBy: null,
        updatedAt: issue.updatedAt,
      },
    ],
  });
  const summary: SelfProfile = {
    id: profileId,
    displayName: 'Hồ sơ thử',
    birthYear: 1950,
    consentStatus: 'confirmed',
    showsVitals: false,
  };
  return {
    actor,
    detail,
    summary,
    empty: false,
    session: {
      account: {
        id: actor.accountId,
        displayName: actor.displayName,
        healthProfileId: profileId as string | null,
        isSystemAdmin: false,
      },
      family: { id: '00000000-0000-4000-8000-000000000004', name: 'Gia đình thử' },
      role,
      csrfToken: 'csrf-test',
    },
  };
}
export type SelfPainData = ReturnType<typeof selfPainData>;
