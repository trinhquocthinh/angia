import { useState } from 'react';
import type { BodyLocation } from '@angia/contracts';
import { findTrackingPainIssue } from '../../application/findTrackingPainIssue';
import { newPainIssueFormSchema } from '../../application/newPainIssueForm';
import { useNewPainIssue } from '../../application/useNewPainIssue';
import type { FirstEntryValues, NewPainIssueSheetProps } from './newPainIssueTypes';
export function useNewPainIssueSheet(props: NewPainIssueSheetProps) {
  const { issues, onContinueIssue, api, session, profile, scope = 'main' } = props;
  const mutation = useNewPainIssue(api, session, profile, scope);
  const [selected, setSelected] = useState<BodyLocation | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<FirstEntryValues>({
    title: '',
    level: null,
    note: '',
    recordedAt: '',
  });
  const [validation, setValidation] = useState<string | null>(null);
  const select = (location: BodyLocation) => {
    if (mutation.pending) return;
    const existing = findTrackingPainIssue(issues, location);
    if (existing) {
      onContinueIssue({ kind: 'existing', issueId: existing.id });
      return;
    }
    setSelected(location);
  };
  const submit = async () => {
    if (!selected || mutation.pending) return;
    const parsed = newPainIssueFormSchema().safeParse(values);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? 'Vui lòng kiểm tra lần ghi.');
      return;
    }
    setValidation(null);
    const result = await mutation.save({ ...selected, ...parsed.data });
    if (result) onContinueIssue(result);
  };
  return {
    ...mutation,
    selected,
    select,
    step,
    setStep,
    values,
    change: (patch: Partial<FirstEntryValues>) => {
      setValidation(null);
      setValues((current) => ({ ...current, ...patch }));
    },
    submit,
    error: validation ?? mutation.error,
  };
}
