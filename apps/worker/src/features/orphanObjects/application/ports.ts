export interface StoredObject {
  key: string;
  lastModified: Date | null;
}
export interface OrphanRepository {
  listFamilyIds(): Promise<string[]>;
  referencedKeys(familyId: string): Promise<Set<string>>;
}
export interface OrphanStorage {
  list(prefix: string): AsyncIterable<StoredObject>;
  delete(key: string): Promise<void>;
}
export interface SweepPolicy {
  graceHours: number;
  maxDeletes: number;
  dryRun: boolean;
  now(): Date;
}
export interface SweepDependencies {
  repository: OrphanRepository;
  storage: OrphanStorage;
}
export interface FamilySweepReport {
  familyId: string;
  scanned: number;
  removed: number;
  skipped: number;
  failed: number;
  outcome: 'swept' | 'empty_references' | 'error';
  reason?: string;
}
export interface SweepResult {
  families: FamilySweepReport[];
  totals: { families: number; scanned: number; removed: number; skipped: number; failed: number };
  capped: boolean;
  aborted: boolean;
  dryRun: boolean;
  listError?: string;
}
