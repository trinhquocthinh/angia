// SPEC-031: trần chi phí OCR riêng từng gia đình; family_extraction_spend chịu RLS nên đọc theo từng gia đình.
export interface FamilyCapRow {
  familyId: string;
  familyName: string;
  /** Giá trị cột families.extraction_cap_usd; null = dùng mặc định env. */
  capUsd: number | null;
  spentUsd: number;
}

interface FamilyCapStore {
  /** Khóa FOR UPDATE dòng gia đình; null khi không tồn tại. */
  lockFamily(familyId: string): Promise<{ familyName: string; capUsd: number | null } | null>;
  readSpent(familyId: string, month: string): Promise<number>;
  setCap(familyId: string, capUsd: number | null): Promise<void>;
  /** Gửi job requeue-awaiting-budget { familyId } cùng transaction với thay đổi trần. */
  requestRequeue(familyId: string): Promise<void>;
}

export interface FamilyCapRepository {
  list(month: string): Promise<FamilyCapRow[]>;
  inTransaction<T>(familyId: string, work: (store: FamilyCapStore) => Promise<T>): Promise<T>;
}

export interface FamilyCapDependencies {
  repository: FamilyCapRepository;
  defaultFamilyCapUsd: number;
  now(): Date;
}
