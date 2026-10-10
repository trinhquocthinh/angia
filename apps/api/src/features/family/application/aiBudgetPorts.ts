// Bảng extraction_spend là dữ liệu quản trị phi y tế, không áp RLS (Tech Spec §3) nên không cần withFamilyScope.
export interface AiBudgetMonth {
  capUsd: number;
  /** Gồm cả phần đang giữ chỗ cho lời gọi AI chưa quyết toán (BR-018). */
  spentUsd: number;
}

interface AiBudgetStore {
  /** Tạo dòng tháng nếu chưa có (chép trần tháng gần nhất, chưa có thì mặc định) rồi khóa FOR UPDATE. */
  lockMonth(month: string, defaultCapUsd: number): Promise<AiBudgetMonth>;
  setCap(month: string, capUsd: number): Promise<void>;
  /** Gửi job requeue-awaiting-budget cùng transaction với thay đổi trần. */
  requestRequeue(): Promise<void>;
}

export interface AiBudgetRepository {
  /** Chỉ đọc: tháng chưa có dòng thì trần theo tháng gần nhất/mặc định và đã dùng 0. */
  read(month: string, defaultCapUsd: number): Promise<AiBudgetMonth>;
  inTransaction<T>(work: (store: AiBudgetStore) => Promise<T>): Promise<T>;
}

export interface AiBudgetDependencies {
  repository: AiBudgetRepository;
  defaultMonthlyCapUsd: number;
  now(): Date;
}

export interface AiBudgetView {
  month: string;
  monthlyCapUsd: number;
  spentThisMonthUsd: number;
}
