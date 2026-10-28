import { updateAiRoutingRequestSchema, type UpdateAiRoutingRequest } from '@angia/contracts';
import type { AiRoutingDraft, AiRoutingErrors, AiRoutingField } from './ports';

type Result = { ok: true; request: UpdateAiRoutingRequest } | { ok: false; errors: AiRoutingErrors };
const fieldPaths: Record<string, AiRoutingField> = {
  'settings.openrouter.primaryModel': 'openrouterPrimary',
  'settings.openrouter.fallbackModel': 'openrouterFallback',
};

export function buildAiRoutingRequest(draft: AiRoutingDraft): Result {
  const parsed = updateAiRoutingRequestSchema.safeParse({
    expectedVersion: draft.expectedVersion,
    settings: {
      openrouter: { primaryModel: draft.openrouterPrimary, fallbackModel: draft.openrouterFallback },
    },
  });
  if (parsed.success) return { ok: true, request: parsed.data };
  const errors: AiRoutingErrors = {};
  for (const issue of parsed.error.issues) {
    const field = fieldPaths[issue.path.join('.')];
    if (field)
      errors[field] =
        issue.code === 'custom'
          ? 'Model dự phòng phải khác model chính.'
          : 'Chọn một giá trị trong danh sách.';
  }
  return { ok: false, errors };
}
