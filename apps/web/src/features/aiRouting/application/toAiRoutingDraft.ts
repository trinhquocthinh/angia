import type { AiRoutingView } from '@angia/contracts';
import type { AiRoutingDraft } from './ports';

// Bản sửa giữ version của lần mở form; dữ liệu cache mới không tự thay version này.
export function toAiRoutingDraft(view: AiRoutingView): AiRoutingDraft {
  return {
    expectedVersion: view.version,
    selectedProvider: view.settings.selectedProvider,
    wokuPrimary: view.settings.woku.primaryModel,
    wokuFallback: view.settings.woku.fallbackModel,
    openrouterPrimary: view.settings.openrouter.primaryModel,
    openrouterFallback: view.settings.openrouter.fallbackModel,
  };
}
