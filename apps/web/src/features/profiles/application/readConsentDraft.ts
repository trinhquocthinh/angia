import type { ConsentConfirmation } from './ports';
export interface ConsentDraft {
  checked: boolean;
  basis: '' | 'self' | 'guardian';
  respondentName: string;
}
export type ConsentMode = 'attestation' | 'self' | 'invitation';
export function readConsentDraft(
  draft: ConsentDraft,
  mode: ConsentMode,
): { body: ConsentConfirmation | null | undefined; error: string } {
  if (mode === 'invitation' || !draft.checked) return { body: undefined, error: '' };
  if (mode === 'self') return { body: { kind: 'self' }, error: '' };
  if (!draft.basis) return { body: null, error: 'Chọn người đã đồng ý.' };
  const respondentName = draft.respondentName.trim().normalize('NFC');
  if (!respondentName || respondentName.length > 60)
    return { body: null, error: 'Tên người đồng ý cần có từ 1 đến 60 ký tự.' };
  return { body: { kind: 'attestation', attestation: true, basis: draft.basis, respondentName }, error: '' };
}
