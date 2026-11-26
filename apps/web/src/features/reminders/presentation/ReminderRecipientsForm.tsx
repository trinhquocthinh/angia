import { useId, useState, type FormEvent } from 'react';
import type { ReminderRecipients } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { Button } from '@src/shared/ui/button/Button';
import { toggleRecipient, validateRecipientSelection } from '../application/recipientSelection';
import { LinkedRecipientNotice } from './LinkedRecipientNotice';
import { ReminderFormFeedback } from './ReminderFormFeedback';
import { ReminderRecipientOption } from './ReminderRecipientOption';

type Props = {
  saved: ReminderRecipients;
  pending: boolean;
  /** Lỗi từ API (đã là thông điệp tiếng Việt). */
  serverError: string | null;
  done: boolean;
  onSubmit: (recipientAccountIds: string[]) => void;
};

// SPEC-026/BR-039: hồ sơ liên kết tài khoản nhận nhắc qua chính tài khoản đó (chỉ hiển thị);
// hồ sơ không liên kết chọn một hoặc nhiều người chăm sóc chính nhận thay.
export function ReminderRecipientsForm({ saved, pending, serverError, done, onSubmit }: Props) {
  const idPrefix = useId();
  const [selected, setSelected] = useState(() => saved.recipients.map((r) => r.accountId));
  const [invalid, setInvalid] = useState<string | null>(null);
  if (saved.mode === 'linked')
    return <LinkedRecipientNotice displayName={saved.recipients[0]?.displayName ?? ''} />;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateRecipientSelection(selected);
    setInvalid(result.ok ? null : result.message);
    if (result.ok) onSubmit(result.ids);
  };
  const error = invalid ?? serverError;
  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-4">
      {saved.recipients.length === 0 && (
        <div className="reminder-callout text-caption">
          <AdminIcon name="info" size={18} />
          <p>Chưa chỉ định người nhận nhắc.</p>
        </div>
      )}
      <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? 'recipient-error' : undefined}>
        <legend className="mb-2 text-caption text-text-secondary">
          Hồ sơ không có tài khoản riêng. Chọn người chăm sóc chính nhận nhắc thay.
        </legend>
        {saved.candidates.map(({ accountId, displayName }) => (
          <ReminderRecipientOption
            key={accountId}
            nameId={`${idPrefix}-${accountId}`}
            accountId={accountId}
            displayName={displayName}
            checked={selected.includes(accountId)}
            onToggle={() => setSelected(toggleRecipient(selected, accountId))}
          />
        ))}
      </fieldset>
      <ReminderFormFeedback
        errorId="recipient-error"
        error={error}
        done={done}
        successText="Đã lưu người nhận nhắc."
      />
      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl shadow-stitch-sm sm:w-auto sm:self-end sm:px-6"
      >
        <AdminIcon name="save" size={18} />
        {pending ? 'Đang lưu…' : 'Lưu người nhận'}
      </Button>
    </form>
  );
}
