type Props = {
  nameId: string;
  accountId: string;
  displayName: string;
  checked: boolean;
  onToggle: () => void;
};

export function ReminderRecipientOption({ nameId, accountId, displayName, checked, onToggle }: Props) {
  return (
    <label className="reminder-recipient-row">
      <input
        type="checkbox"
        name="recipientAccountIds"
        value={accountId}
        checked={checked}
        aria-labelledby={nameId}
        onChange={onToggle}
        className="size-5 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      />
      <span className="reminder-ceramic-avatar reminder-ceramic-avatar-sm" aria-hidden="true">
        {displayName.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span id={nameId} className="block text-body font-semibold break-words text-text-primary">
          {displayName}
        </span>
        <span className="block text-caption text-text-secondary">
          {checked ? 'Đang nhận lời nhắc' : 'Người chăm sóc chính'}
        </span>
      </span>
    </label>
  );
}
