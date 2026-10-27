import type { useAiRoutingDraft } from '../application/useAiRoutingDraft';
import { AdminSelect } from '@src/features/family/presentation/components/AdminSelect';

export function AiRoutingProviderField({ editor }: { editor: ReturnType<typeof useAiRoutingDraft> }) {
  return (
    <div className="grid gap-1.5">
      <label className="grid gap-1.5 text-[12px] font-semibold text-[#404945]">
        Nhà cung cấp
        <AdminSelect
          name="selectedProvider"
          aria-invalid={Boolean(editor.errors.selectedProvider)}
          aria-describedby={editor.errors.selectedProvider ? 'routing-provider-error' : undefined}
          value={editor.draft.selectedProvider}
          onChange={(e) => editor.change('selectedProvider', e.currentTarget.value)}
        >
          <option value="woku">Woku</option>
          <option value="openrouter">OpenRouter</option>
        </AdminSelect>
      </label>
      {editor.errors.selectedProvider && (
        <p id="routing-provider-error" role="alert" className="m-0 text-[12px] text-[#93000a]">
          {editor.errors.selectedProvider}
        </p>
      )}
    </div>
  );
}
