import type { AiRoutingSettings, AiRoutingView } from '@angia/contracts';

interface AiRoutingChange {
  expectedVersion: number;
  settings: AiRoutingSettings;
  updatedBy: string;
  updatedAt: Date;
}

// Cấu hình và lịch sử chỉ chứa dữ liệu quản trị, không có chứng từ/key/URL nhà cung cấp.
export interface AiRoutingRepository {
  read(): Promise<AiRoutingView>;
  /** Cập nhật và ghi audit cùng transaction; null khi version không còn khớp. */
  compareAndSet(change: AiRoutingChange): Promise<AiRoutingView | null>;
}

export interface AiRoutingDependencies {
  repository: AiRoutingRepository;
  now(): Date;
}
