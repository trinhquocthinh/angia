import type { PainIssueSummary } from '@angia/contracts';

export type PainJournalActions = {
  onCreate?: (() => void) | undefined;
  onOpen?: ((issue: PainIssueSummary) => void) | undefined;
  onRecord?: ((issue: PainIssueSummary) => void) | undefined;
};
