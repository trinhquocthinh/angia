import { aiRoutingViewSchema, type AiRoutingView } from '@angia/contracts';

export type AiRoutingRow = {
  version: string;
  settings: unknown;
  updated_at: string | null;
  updated_by: string | null;
};

// DB sai/mất singleton phải báo lỗi, không tự chọn provider để che lỗi cấu hình.
export function toAiRoutingView(row: AiRoutingRow | undefined): AiRoutingView {
  if (!row) throw new Error('Không tìm thấy cấu hình OCR; cần kiểm tra migration');
  return aiRoutingViewSchema.parse({
    version: Number(row.version),
    settings: row.settings,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    updatedBy: row.updated_by,
  });
}
