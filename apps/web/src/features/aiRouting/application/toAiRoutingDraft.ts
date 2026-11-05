import type { AiRoutingView } from '@angia/contracts';
import type { AiRoutingDraft } from './ports';

// Bản sửa giữ version của lần mở form; dữ liệu cache mới không tự thay version này.
export function toAiRoutingDraft(view: AiRoutingView): AiRoutingDraft {
  return {
    expectedVersion: view.version,
    openrouterPrimary: view.settings.openrouter.primaryModel,
    openrouterFallback: view.settings.openrouter.fallbackModel,
  };
}
