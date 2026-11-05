import { budgetMonth, type AiRoutingView } from '@angia/contracts';
import type { AiRunMode, ExtractionSnapshot } from './ports.js';

export function resolveExtractionSnapshot(
  view: AiRoutingView,
  runMode: AiRunMode,
  now: Date,
): ExtractionSnapshot {
  const models = view.settings.openrouter;
  return Object.freeze({
    runMode,
    provider: 'openrouter' as const,
    primaryModel: models.primaryModel,
    fallbackModel: models.fallbackModel,
    month: budgetMonth(now),
    version: view.version,
  });
}
