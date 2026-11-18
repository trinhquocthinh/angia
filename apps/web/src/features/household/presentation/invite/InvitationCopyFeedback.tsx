export function InvitationCopyFeedback({
  message,
  manual,
  disabled,
}: {
  message: string;
  manual: string;
  disabled: boolean;
}) {
  return (
    <>
      {message && (
        <p role="status" className="household-invite-feedback">
          {message}
        </p>
      )}
      {manual && !disabled && (
        <label className="household-invite-manual">
          Nội dung để sao chép
          <textarea readOnly value={manual} onFocus={(event) => event.currentTarget.select()} />
        </label>
      )}
    </>
  );
}
