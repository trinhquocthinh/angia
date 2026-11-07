import type { CreatePainEntryRequest } from '@angia/contracts';
export type PainIssueHandoff =
  | { kind: 'created'; issueId: string }
  | { kind: 'existing'; issueId: string; draft?: CreatePainEntryRequest; message?: string };
