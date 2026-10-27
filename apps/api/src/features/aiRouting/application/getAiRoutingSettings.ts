import type { AiRoutingView } from '@angia/contracts';
import type { AiRoutingRepository } from './ports.js';

// GET chỉ đọc, không tự tạo mặc định nếu DB lỗi hoặc chưa chạy migration.
export function getAiRoutingSettings(repository: AiRoutingRepository): Promise<AiRoutingView> {
  return repository.read();
}
