import { Link } from '@tanstack/react-router';
import { Button } from '@src/shared/ui/button/Button';
import { useAcceptHouseholdInvitation } from '../../application/useAcceptHouseholdInvitation';
import { acceptHouseholdInvitation } from '../../infrastructure/acceptHouseholdInvitation';
import { InvitationIcon } from './InvitationIcon';

export function AcceptHouseholdInvitationForm({
  csrfToken,
  refresh,
}: {
  csrfToken: string;
  refresh: () => Promise<unknown>;
}) {
  const model = useAcceptHouseholdInvitation(acceptHouseholdInvitation, csrfToken, refresh);
  const busy = model.form.formState.isSubmitting || model.refreshing;
  const fieldError = model.form.formState.errors.code?.message;
  return (
    <section className="household-start-panel household-join" aria-labelledby="household-join-title">
      <Link to="/waiting" search={{}} className="household-start-back">
        <InvitationIcon name="back" />
        Quay lại
      </Link>
      <h1 id="household-join-title">Tôi có mã mời</h1>
      <p className="household-start-description">Nhập mã người thân đã gửi để tham gia nhà.</p>
      <form onSubmit={model.submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy || model.accepted}>
          <label htmlFor="household-invitation-code">Mã mời</label>
          <input
            id="household-invitation-code"
            {...model.form.register('code')}
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={64}
            placeholder="A7F2 9C4E 8B1D"
            aria-invalid={Boolean(fieldError)}
            aria-describedby={`household-invitation-code-help${fieldError ? ' household-invitation-code-error' : ''}`}
          />
          <p id="household-invitation-code-help">Mã gồm 12 ký tự chữ và số.</p>
          {fieldError && (
            <p role="alert" id="household-invitation-code-error" className="text-danger">
              {fieldError}
            </p>
          )}
        </fieldset>
        <Button type="submit" disabled={busy || !csrfToken}>
          {busy
            ? model.accepted
              ? 'Đang tải thông tin nhà…'
              : 'Đang xác nhận…'
            : model.accepted
              ? 'Tải lại thông tin nhà'
              : 'Xác nhận vào nhà'}
        </Button>
        {model.error && (
          <p role="alert" className="text-danger">
            {model.error}
          </p>
        )}
      </form>
      <p className="household-join-note">Vào nhà chưa liên kết bạn với hồ sơ nào.</p>
    </section>
  );
}
