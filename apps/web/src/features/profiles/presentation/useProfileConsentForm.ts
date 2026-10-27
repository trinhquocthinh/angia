import { useReducer } from 'react';
import type { ChangeEvent } from 'react';
import { profileConsentReducer } from '../application/profileConsentReducer';
import { readConsentDraft } from '../application/readConsentDraft';
import type { ConsentMode } from '../application/readConsentDraft';

export function useProfileConsentForm(currentAccountId: string) {
  const [state, dispatch] = useReducer(profileConsentReducer, {
    displayName: '',
    accountId: '',
    draft: { checked: false, basis: '', respondentName: '' },
  });
  const mode: ConsentMode = !state.accountId
    ? 'attestation'
    : state.accountId === currentAccountId
      ? 'self'
      : 'invitation';
  const onChange = (event: ChangeEvent<HTMLFormElement>) => {
    const target = event.target;
    if (target.name === 'displayName') dispatch({ type: 'name', value: target.value });
    if (target.name === 'linkedAccountId') dispatch({ type: 'account', value: target.value });
  };
  return {
    state,
    mode,
    onChange,
    setDraft: (value: typeof state.draft) => dispatch({ type: 'consent', value }),
    result: readConsentDraft(state.draft, mode),
  };
}
