import type { ExportAccountScope, ExportProfileScope } from '../domain/resolveExportScope.js';

export interface ExportEntry {
  name: string;
  compress: boolean;
  chunks: AsyncIterable<Uint8Array>;
}
export interface ExportAccount extends ExportAccountScope {
  data: Record<string, unknown>;
}
export interface ExportSession {
  request: { accountId: string; profileId: string | null };
  getAccount(): Promise<ExportAccount>;
  getProfile(familyId: string, profileId: string, accountId: string): Promise<ExportProfileScope | null>;
  profileChunks(familyId: string, profileId: string): AsyncIterable<Uint8Array>;
  images(familyId: string, profileId: string): AsyncIterable<{ id: string; key: string }>;
  enterRemovedWindowScope(): Promise<void>;
  removedProfiles(): Promise<Array<{ familyId: string; profileId: string }>>;
  leaveRemovedWindowScope(): Promise<void>;
  markReady(key: string): Promise<void>;
  markFailed(): Promise<void>;
}
export type ExportOutcome = 'ready' | 'failed' | 'skipped';
export interface DataExportDependencies {
  repository: {
    withPending(id: string, work: (session: ExportSession) => Promise<ExportOutcome>): Promise<ExportOutcome>;
  };
  archive: { write(key: string, entries: AsyncIterable<ExportEntry>): Promise<void> };
  images: { read(key: string): AsyncIterable<Uint8Array> };
}
