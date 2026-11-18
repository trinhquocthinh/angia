import { useRef, useState, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import type { AcceptHouseholdInvitation } from './acceptInvitationPorts';
import { prepareInvitationCode } from './prepareInvitationCode';
import { invitationErrorMessage } from './invitationErrorMessage';

export function useAcceptHouseholdInvitation(
  action: AcceptHouseholdInvitation,
  csrfToken: string,
  refresh: () => Promise<unknown>,
) {
  const form = useForm<{ code: string }>({ defaultValues: { code: '' } });
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const locked = useRef(false);
  const needsSession = useRef(false);
  async function recover() {
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      setError('Đã nhận lời mời. Chưa thể tải thông tin nhà. Vui lòng thử tải lại.');
    } finally {
      setRefreshing(false);
    }
  }
  async function accept({ code }: { code: string }) {
    if (locked.current || !csrfToken) return;
    locked.current = true;
    setError(null);
    form.clearErrors();
    try {
      if (needsSession.current) return await recover();
      const token = prepareInvitationCode(code);
      if (!token) {
        form.setError('code', { message: 'Vui lòng nhập mã mời gồm 12 ký tự chữ và số.' });
        return;
      }
      const result = await action({ token }, csrfToken);
      if (result.ok) {
        needsSession.current = true;
        setAccepted(true);
        await recover();
      } else
        setError(
          result.code === 'ERR_ACCOUNT_ALREADY_IN_FAMILY'
            ? 'Bạn đang thuộc một nhà. Hãy rời nhà hiện tại trước khi nhận lời mời khác.'
            : result.code === 'ERR_DELETION_PENDING'
              ? 'Nhà đang chờ xoá. Chưa thể nhận lời mời.'
              : result.code === 'ERR_NOT_FOUND'
                ? 'Lời mời không còn dùng được. Hãy nhờ người mời gửi mã mới.'
                : invitationErrorMessage(result.code),
        );
    } catch {
      setError(invitationErrorMessage('NETWORK'));
    } finally {
      locked.current = false;
    }
  }
  const submit = (event?: BaseSyntheticEvent) => form.handleSubmit(accept)(event);
  return { form, submit, error, accepted, refreshing };
}
