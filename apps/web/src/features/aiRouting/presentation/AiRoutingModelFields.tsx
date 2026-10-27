import { OPENROUTER_OCR_MODELS, WOKU_OCR_MODELS } from '@angia/contracts';
import type { useAiRoutingDraft } from '../application/useAiRoutingDraft';
import { AdminSelect } from '@src/features/family/presentation/components/AdminSelect';
import { AI_MODEL_LABELS } from './aiModelLabels';

export function AiRoutingModelFields({
  provider,
  editor,
}: {
  provider: 'woku' | 'openrouter';
  editor: ReturnType<typeof useAiRoutingDraft>;
}) {
  const primary = provider === 'woku' ? 'wokuPrimary' : 'openrouterPrimary';
  const fallback = provider === 'woku' ? 'wokuFallback' : 'openrouterFallback';
  const name = provider === 'woku' ? 'Woku' : 'OpenRouter';
  const models = provider === 'woku' ? WOKU_OCR_MODELS : OPENROUTER_OCR_MODELS;
  return (
    <fieldset className="grid min-w-0 gap-3 rounded-xl border border-[#e4f0f0] p-3">
      <legend className="px-1 text-[12px] font-semibold text-[#286958]">{name}</legend>
      <label className="grid gap-1.5 text-[12px] font-medium text-[#404945]">
        Model chính {name}
        <AdminSelect
          name={primary}
          value={editor.draft[primary]}
          aria-invalid={Boolean(editor.errors[primary])}
          aria-describedby={editor.errors[primary] ? `${primary}-error` : undefined}
          onChange={(e) => editor.change(primary, e.currentTarget.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {AI_MODEL_LABELS[model]}
            </option>
          ))}
        </AdminSelect>
      </label>
      {editor.errors[primary] && (
        <p id={`${primary}-error`} role="alert" className="m-0 text-[12px] text-[#93000a]">
          {editor.errors[primary]}
        </p>
      )}
      <label className="grid gap-1.5 text-[12px] font-medium text-[#404945]">
        Model dự phòng {name}
        <AdminSelect
          name={fallback}
          value={editor.draft[fallback]}
          aria-invalid={Boolean(editor.errors[fallback])}
          aria-describedby={editor.errors[fallback] ? `${fallback}-error` : undefined}
          onChange={(e) => editor.change(fallback, e.currentTarget.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {AI_MODEL_LABELS[model]}
            </option>
          ))}
        </AdminSelect>
      </label>
      {editor.errors[fallback] && (
        <p id={`${fallback}-error`} role="alert" className="m-0 text-[12px] text-[#93000a]">
          {editor.errors[fallback]}
        </p>
      )}
    </fieldset>
  );
}
