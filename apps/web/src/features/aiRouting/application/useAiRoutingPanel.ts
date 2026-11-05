import { useState } from 'react';
import type { AiRoutingView, UpdateAiRoutingRequest } from '@angia/contracts';
import type { useAiRouting } from './useAiRouting';

export function useAiRoutingPanel(state: ReturnType<typeof useAiRouting>) {
  const [editing, setEditing] = useState<AiRoutingView | null>(null);
  const start = () => {
    if (state.config.data) {
      state.save.reset();
      setEditing(state.config.data);
    }
  };
  const reload = async () => {
    if (state.save.isPending) return;
    const result = await state.config.refetch();
    if (result.isSuccess) {
      setEditing(null);
      state.save.reset();
    }
  };
  const submit = (input: UpdateAiRoutingRequest) =>
    state.save.mutate(input, {
      onSuccess: () => setEditing(null),
    });
  return { editing, start, reload, submit, cancel: () => setEditing(null) };
}
