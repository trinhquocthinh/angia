import { useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { prepareHouseholdName } from './prepareHouseholdName';
import { householdErrorMessage } from './householdErrorMessage';
import type { SubmitHousehold } from './ports';

export function useCreateHousehold(action: SubmitHousehold, token: string, refresh: () => Promise<unknown>) {
  const form = useForm<{ name: string }>({ defaultValues: { name: '' } });
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const locked = useRef(false);
  const needsSession = useRef(false);
  async function recover() {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      setError('Chưa thể tải thông tin nhà. Vui lòng thử lại.');
    } finally {
      setRefreshing(false);
    }
  }
  async function create({ name }: { name: string }) {
    if (locked.current) return;
    locked.current = true;
    setError(null);
    form.clearErrors();
    try {
      if (needsSession.current) return await recover();
      const body = prepareHouseholdName(name);
      if ('error' in body) {
        form.setError('name', { type: 'validate', message: body.error });
        return;
      }
      const result = await action(body, token);
      if (result.ok || result.code === 'ERR_ACCOUNT_ALREADY_IN_FAMILY') {
        needsSession.current = true;
        setCreated(true);
        await recover();
      } else if (result.code === 'ERR_UNAUTHENTICATED') await recover();
      else setError(householdErrorMessage(result.code));
    } catch {
      setError(householdErrorMessage('NETWORK'));
    } finally {
      locked.current = false;
    }
  }
  const submit = (event?: BaseSyntheticEvent) => form.handleSubmit(create)(event);
  return { form, submit, error, created, refreshing };
}
