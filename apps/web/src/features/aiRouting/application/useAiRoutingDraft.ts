import { useState } from 'react';
import type { AiRoutingView } from '@angia/contracts';
import { toAiRoutingDraft } from './toAiRoutingDraft';
import { buildAiRoutingRequest } from './buildAiRoutingRequest';
import type { AiRoutingErrors, AiRoutingField } from './ports';

export function useAiRoutingDraft(initial: AiRoutingView) {
  const [draft, setDraft] = useState(() => toAiRoutingDraft(initial));
  const [errors, setErrors] = useState<AiRoutingErrors>({});
  const change = (field: AiRoutingField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };
  const prepare = () => {
    const result = buildAiRoutingRequest(draft);
    setErrors(result.ok ? {} : result.errors);
    return result.ok ? result.request : null;
  };
  return { draft, errors, change, prepare };
}
