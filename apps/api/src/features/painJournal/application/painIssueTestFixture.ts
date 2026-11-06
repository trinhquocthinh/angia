import { vi } from 'vitest';
import type { PainIssueDetail, PainIssueSummary } from '@angia/contracts';
import type { PainIssue } from '../domain/painIssue.js';
import type { PainIssueRepository, PainIssueStore } from './ports.js';

export const target = { familyId: 'family-1', profileId: 'profile-1', issueId: 'issue-1' };
export const session = { ...target, accountId: 'session-account' };
export const now = () => new Date('2026-11-05T17:30:00.000Z');
export const actor = { accountId: 'session-account', displayName: 'Thịnh' };
export const issue: PainIssue = {
  id: 'issue-1',
  healthProfileId: 'profile-1',
  region: 'knee',
  side: 'left',
  title: null,
  status: 'tracking',
  resolvedOn: null,
};
export const summary: PainIssueSummary = {
  id: 'issue-1',
  region: 'knee',
  side: 'left',
  title: null,
  status: 'tracking',
  resolvedOn: null,
  lastEntry: { level: 6, recordedAt: '2026-11-05T17:00:00.000Z' },
  entryCount: 1,
  exerciseCount: 0,
  createdBy: actor,
  updatedBy: actor,
  updatedAt: '2026-11-05T17:00:00.000Z',
};
export const detail: PainIssueDetail = {
  ...summary,
  entries: [
    {
      id: 'entry-1',
      level: 6,
      recordedAt: summary.lastEntry.recordedAt,
      note: null,
      createdBy: actor,
      updatedBy: actor,
      updatedAt: summary.updatedAt,
    },
  ],
  exercises: [],
  statusEvents: [],
};

export function painIssueFixture() {
  const store = {
    findProfile: vi.fn<PainIssueStore['findProfile']>().mockResolvedValue({ consentStatus: 'confirmed' }),
    findIssue: vi.fn<PainIssueStore['findIssue']>().mockResolvedValue({
      issue,
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    }),
    findTrackingIssue: vi.fn<PainIssueStore['findTrackingIssue']>().mockResolvedValue(null),
    listIssues: vi.fn<PainIssueStore['listIssues']>().mockResolvedValue([summary]),
    getDetail: vi.fn<PainIssueStore['getDetail']>().mockResolvedValue(detail),
    insertIssue: vi.fn<PainIssueStore['insertIssue']>().mockResolvedValue({ ok: true, value: detail }),
    updateIssue: vi.fn<PainIssueStore['updateIssue']>().mockResolvedValue({ ok: true, value: summary }),
    changeStatus: vi.fn<PainIssueStore['changeStatus']>().mockResolvedValue({ ok: true, value: summary }),
    countImpact: vi
      .fn<PainIssueStore['countImpact']>()
      .mockResolvedValue({ entryCount: 5, exerciseCount: 2 }),
    deleteIssue: vi.fn<PainIssueStore['deleteIssue']>().mockResolvedValue(undefined),
  };
  const repository: PainIssueRepository = {
    withFamily: vi.fn(async (familyId, work) => {
      if (familyId !== target.familyId) throw new Error('Sai phạm vi gia đình');
      return work(store);
    }),
  };
  return { store, repository };
}
