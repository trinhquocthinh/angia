import { budgetMonth, type AiRoutingView } from '@angia/contracts';
import type { AiRunMode, ExtractionSnapshot } from './ports.js';

export function resolveExtractionSnapshot(
  view: AiRoutingView,
  runMode: AiRunMode,
  now: Date,
): ExtractionSnapshot {
  const provider = view.settings.selectedProvider;
  const models = view.settings[provider];
  return Object.freeze({
    runMode,
    provider,
    primaryModel: models.primaryModel,
    fallbackModel: models.fallbackModel,
    month: budgetMonth(now),
    version: view.version,
  });
}
