import { useState, type FormEvent } from 'react';
import type { ReminderRecipients } from '@angia/contracts';
import { toggleRecipient, validateRecipientSelection } from '../application/recipientSelection';
import { LinkedRecipientNotice } from './LinkedRecipientNotice';

type Props = {
  saved: ReminderRecipients;
  pending: boolean;
  /** Lỗi từ API (đã là thông điệp tiếng Việt). */
  serverError: string | null;
  done: boolean;
  onSubmit: (recipientAccountIds: string[]) => void;
};

// SPEC-026/BR-039: hồ sơ liên kết tài khoản nhận nhắc qua chính tài khoản đó (chỉ hiển thị);
// hồ sơ không liên kết (trẻ nhỏ) chọn một hoặc nhiều người chăm sóc chính nhận thay.
export function ReminderRecipientsForm({ saved, pending, serverError, done, onSubmit }: Props) {
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
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
      {saved.recipients.length === 0 && (
        <p className="rounded-xl bg-[#eaf6f5] px-4 py-3 text-sm text-[#404945]">
          Chưa chỉ định người nhận nhắc.
        </p>
      )}
      <fieldset className="flex flex-col gap-2" aria-describedby={error ? 'recipient-error' : undefined}>
        <legend className="mb-1 text-xs text-[#404945]">
          Hồ sơ không có tài khoản riêng. Chọn người chăm sóc chính nhận nhắc thay.
        </legend>
        {saved.candidates.map(({ accountId, displayName }) => (
          <label key={accountId} className="flex min-h-11 items-center gap-3 text-base text-[#131d1d]">
            <input
              type="checkbox"
              name="recipientAccountIds"
              value={accountId}
              checked={selected.includes(accountId)}
              onChange={() => setSelected(toggleRecipient(selected, accountId))}
              className="size-5 accent-[#004135]"
            />
            {displayName}
          </label>
        ))}
      </fieldset>
      {error && (
        <p id="recipient-error" role="alert" className="text-sm font-medium text-[#ba1a1a]">
          {error}
        </p>
      )}
      {done && !error && (
        <p role="status" className="text-sm font-medium text-[#286958]">
          Đã lưu người nhận nhắc.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded-xl bg-[#004135] px-5 text-sm font-semibold text-white disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        {pending ? 'Đang lưu…' : 'Lưu người nhận'}
      </button>
    </form>
  );
}
