import { HouseholdCreationHeading } from './HouseholdCreationHeading';
import { Link } from '@tanstack/react-router';
import { useCreateHousehold } from '../../application/useCreateHousehold';
import { submitHousehold } from '../../infrastructure/submitHousehold';
import { Button } from '@src/shared/ui/button/Button';
import { StartIcon } from './StartIcon';
import { HouseholdCreationFields } from './HouseholdCreationFields';
import { HouseholdCreationHighlights } from './HouseholdCreationHighlights';
import { HouseholdCreationFootnote } from './HouseholdCreationFootnote';
type Props = { token: string; refresh: () => Promise<unknown>; invitationToken?: string };
export function CreateHouseholdForm({ token, refresh, invitationToken }: Props) {
  const { form, submit, error, created, refreshing, invitationInvalid } = useCreateHousehold(
    submitHousehold,
    token,
    refresh,
    invitationToken,
  );
  const busy = form.formState.isSubmitting || refreshing;
  return (
    <section
      className="household-start-panel household-start-create household-create-compact"
      aria-labelledby="household-create-title"
    >
      <div className="household-create-navigation">
        <Link to="/waiting" search={{}} className="household-start-back">
          <StartIcon name="back" />
          Quay lại
        </Link>
        <span className="household-create-step">Bước 2 / 2</span>
      </div>
      <div className="household-create-block">
        <HouseholdCreationHeading invited={Boolean(invitationToken)} />
        <form className="household-start-form" onSubmit={submit} noValidate aria-busy={busy}>
          <HouseholdCreationFields form={form} disabled={busy || created || invitationInvalid} />
          <HouseholdCreationHighlights />
          {created && <p role="status">Đang cập nhật thông tin nhà cho tài khoản của bạn.</p>}
          <Button
            type="submit"
            disabled={busy || !token || invitationInvalid}
            className="household-create-submit"
          >
            <span>
              {busy
                ? created
                  ? 'Đang tải thông tin nhà…'
                  : 'Đang tạo nhà…'
                : created
                  ? 'Thử tải lại thông tin nhà'
                  : 'Tạo nhà'}
            </span>
            <StartIcon name="forward" />
          </Button>
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </form>
      </div>
      <HouseholdCreationFootnote />
    </section>
  );
}
