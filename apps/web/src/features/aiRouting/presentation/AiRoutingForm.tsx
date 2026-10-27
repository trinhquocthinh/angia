import type { AiRoutingView, UpdateAiRoutingRequest } from '@angia/contracts';
import { useAiRoutingDraft } from '../application/useAiRoutingDraft';
import { AiRoutingProviderField } from './AiRoutingProviderField';
import { AiRoutingModelFields } from './AiRoutingModelFields';
import { AiRoutingFormActions } from './AiRoutingFormActions';

export function AiRoutingForm({
  initial,
  pending,
  error,
  onSave,
  onCancel,
  onReload,
}: {
  initial: AiRoutingView;
  pending: boolean;
  error: Error | null;
  onSave(input: UpdateAiRoutingRequest): void;
  onCancel(): void;
  onReload(): void;
}) {
  const editor = useAiRoutingDraft(initial);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const input = editor.prepare();
        if (input) onSave(input);
      }}
    >
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-4 border-0 p-0 disabled:opacity-70">
        <AiRoutingProviderField editor={editor} />
        <AiRoutingModelFields provider="woku" editor={editor} />
        <AiRoutingModelFields provider="openrouter" editor={editor} />
        <AiRoutingFormActions pending={pending} error={error} onCancel={onCancel} onReload={onReload} />
      </fieldset>
    </form>
  );
}
