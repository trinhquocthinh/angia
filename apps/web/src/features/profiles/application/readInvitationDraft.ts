import type { InvitationDraft } from './invitationPorts';
export function readInvitationDraft(
  name: string,
  basis: 'self' | 'guardian' | null,
  decision: 'accepted' | 'declined',
) {
  const errors: { respondentName?: string; basis?: string } = {};
  const respondentName = name.trim();
  if (!respondentName || respondentName.length > 60) errors.respondentName = 'Nhập tên từ 1 đến 60 ký tự.';
  if (!basis) errors.basis = 'Vui lòng chọn tư cách của bạn.';
  const body: InvitationDraft | null =
    Object.keys(errors).length || !basis ? null : { respondentName, basis, decision };
  return { body, errors };
}
