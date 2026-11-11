import { OPENROUTER_OCR_MODELS } from '@angia/contracts';
import type { useAiRoutingDraft } from '../application/useAiRoutingDraft';
import { AdminSelect } from '@src/features/family/presentation/components/AdminSelect';
import { AI_MODEL_LABELS } from './aiModelLabels';

export function AiRoutingModelFields({ editor }: { editor: ReturnType<typeof useAiRoutingDraft> }) {
  const primary = 'openrouterPrimary';
  const fallback = 'openrouterFallback';
  const name = 'OpenRouter';
  const models = OPENROUTER_OCR_MODELS;
  return (
    <fieldset className="grid min-w-0 gap-3 rounded-xl border border-border p-3">
      <legend className="px-1 text-[12px] font-semibold text-accent">{name}</legend>
      <label className="grid gap-1.5 text-[12px] font-medium text-text-secondary">
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
        <p id={`${primary}-error`} role="alert" className="m-0 text-[12px] text-danger">
          {editor.errors[primary]}
        </p>
      )}
      <label className="grid gap-1.5 text-[12px] font-medium text-text-secondary">
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
        <p id={`${fallback}-error`} role="alert" className="m-0 text-[12px] text-danger">
          {editor.errors[fallback]}
        </p>
      )}
    </fieldset>
  );
}
