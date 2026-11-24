import { useRef, useState } from 'react';
import { accountDeletionErrorMessage } from '@src/features/account/application/accountDeletionErrorMessage';
import type {
  AccountProfileDisposition,
  DeleteAccountBody,
  SubmitAccountDeletion,
} from '@src/features/account/application/ports';

type Options = {
  csrfToken: string;
  hasLinkedProfile: boolean;
  submitDeletion: SubmitAccountDeletion;
  onDeleted: () => Promise<void> | void;
};

type DeletionState = {
  open: boolean;
  password: string;
  disposition: AccountProfileDisposition | null;
  pending: boolean;
  error: string | null;
  errorCode: string | null;
};

const INITIAL_STATE: DeletionState = {
  open: false,
  password: '',
  disposition: null,
  pending: false,
  error: null,
  errorCode: null,
};

export function useAccountDeletion({ csrfToken, hasLinkedProfile, submitDeletion, onDeleted }: Options) {
  const [state, setState] = useState<DeletionState>(INITIAL_STATE);
  const submittingRef = useRef(false);

  const canSubmit =
    !state.pending && state.password.length > 0 && (!hasLinkedProfile || state.disposition !== null);

  const openDialog = () => {
    submittingRef.current = false;
    setState({ ...INITIAL_STATE, open: true });
  };

  const closeDialog = () => {
    if (submittingRef.current || state.pending) return;
    setState(INITIAL_STATE);
  };

  const setPassword = (password: string) => {
    setState((prev) => ({ ...prev, password }));
  };

  const setDisposition = (disposition: AccountProfileDisposition) => {
    setState((prev) => ({ ...prev, disposition }));
  };

  const submit = async () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setState((prev) => ({ ...prev, pending: true, error: null, errorCode: null }));
    const body: DeleteAccountBody =
      hasLinkedProfile && state.disposition
        ? { password: state.password, ownProfileDisposition: state.disposition }
        : { password: state.password };
    const result = await submitDeletion(body, csrfToken);
    if (result.ok) {
      await onDeleted();
      return;
    }
    submittingRef.current = false;
    setState((prev) => ({
      ...prev,
      pending: false,
      error: accountDeletionErrorMessage(result.code),
      errorCode: result.code,
    }));
  };

  return {
    ...state,
    canSubmit,
    openDialog,
    closeDialog,
    setPassword,
    setDisposition,
    submit,
  };
}
