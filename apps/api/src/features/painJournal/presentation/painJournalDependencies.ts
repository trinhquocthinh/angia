import type { PainIssueClock, PainIssueRepository } from '../application/ports.js';

export interface PainJournalDependencies {
  repository: PainIssueRepository;
  forProfile(profileId: string): PainIssueRepository;
}
export interface PainJournalRouteDependencies extends PainJournalDependencies {
  now: PainIssueClock;
}
