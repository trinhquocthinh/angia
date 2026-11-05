import type { ConsentDraft } from './readConsentDraft';
export interface ProfileConsentState {
  displayName: string;
  accountId: string;
  draft: ConsentDraft;
}
export type ProfileConsentEvent =
  { type: 'name' | 'account'; value: string } | { type: 'consent'; value: ConsentDraft };
export function profileConsentReducer(
  state: ProfileConsentState,
  event: ProfileConsentEvent,
): ProfileConsentState {
  if (event.type === 'consent') return { ...state, draft: event.value };
  if (event.type === 'account')
    return { ...state, accountId: event.value, draft: { checked: false, basis: '', respondentName: '' } };
  const suggest =
    state.draft.basis === 'self' &&
    (!state.draft.respondentName || state.draft.respondentName === state.displayName);
  return {
    ...state,
    displayName: event.value,
    draft: { ...state.draft, respondentName: suggest ? event.value : state.draft.respondentName },
  };
}
