import type { RateLimitDependencies } from '@src/shared/rateLimit/application/ports.js';
import type { ObjectReader } from '@src/features/documents/application/reviewPorts.js';

export interface RequestExportInput {
  accountId: string;
  familyId: string | null;
  role: 'main' | 'member' | null;
  profileId: string | null;
}
export type ExportRequestResult =
  | { ok: true; exportId: string }
  | { ok: false; code: 'ERR_NOT_FOUND' }
  | { ok: false; code: 'ERR_RATE_LIMITED'; retryAfterSeconds: number };
interface ExportRequestSession {
  rateLimit: RateLimitDependencies;
  profileAllowed(familyId: string, profileId: string, accountId: string): Promise<boolean>;
  enqueue(profileId: string | null): Promise<string>;
}
export interface ExportRecord {
  id: string;
  status: 'pending' | 'ready' | 'failed';
  objectKey: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}
export interface DataExportRepository {
  withRequest(
    accountId: string,
    work: (session: ExportRequestSession) => Promise<ExportRequestResult>,
  ): Promise<ExportRequestResult>;
  find(accountId: string, id: string): Promise<ExportRecord | null>;
}
export interface DataExportDependencies {
  repository: DataExportRepository;
  reader: ObjectReader;
  now(): Date;
}
