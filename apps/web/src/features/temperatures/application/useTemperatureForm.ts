import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { RecordTemperatureRequest } from '@angia/contracts';
import { temperatureFormSchema, type TemperatureFormValues } from './temperatureForm';
import type { TemperatureMutationResult } from './useTemperatureMutation';

export function useTemperatureForm(
  pending: boolean,
  onSave: (request: RecordTemperatureRequest) => Promise<TemperatureMutationResult>,
) {
  const form = useForm<TemperatureFormValues>({ defaultValues: { celsius: '', measuredAt: '' } });
  const [confirmation, setConfirmation] = useState<RecordTemperatureRequest | null>(null);
  const submit = form.handleSubmit(async (values) => {
    if (pending) return;
    const parsed = temperatureFormSchema().safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        form.setError(
          issue.path[0] as keyof TemperatureFormValues,
          { message: issue.message },
          { shouldFocus: true },
        );
      }
      return;
    }
    const request = parsed.data;
    const confirmed =
      confirmation?.celsius === request.celsius && confirmation.measuredAt === request.measuredAt;
    const result = await onSave({ ...request, confirmOutOfRange: confirmed });
    setConfirmation(result === 'confirm' ? request : null);
  });
  return { form, confirmation, submit, resetConfirmation: () => setConfirmation(null) };
}
