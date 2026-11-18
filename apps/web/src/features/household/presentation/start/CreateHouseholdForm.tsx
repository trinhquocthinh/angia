import { Link } from '@tanstack/react-router';
import { useCreateHousehold } from '../../application/useCreateHousehold';
import { submitHousehold } from '../../infrastructure/submitHousehold';
import { Button } from '@src/shared/ui/button/Button';
import { StartIcon } from './StartIcon';
import { HouseholdCreationFields } from './HouseholdCreationFields';
import { HouseholdCreationHighlights } from './HouseholdCreationHighlights';
import { HouseholdCreationFootnote } from './HouseholdCreationFootnote';
export function CreateHouseholdForm({ token, refresh }: { token: string; refresh: () => Promise<unknown> }) {
  const { form, submit, error, created, refreshing } = useCreateHousehold(submitHousehold, token, refresh);
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
        <div className="household-create-heading">
          <span>02 — Thiết lập gia đình</span>
          <h1 id="household-create-title">Tạo nhà mới</h1>
          <p className="household-start-description">
            Đặt tên dễ nhớ cho không gian theo dõi và chăm sóc sức khỏe gia đình bạn.
          </p>
        </div>
        <form className="household-start-form" onSubmit={submit} noValidate aria-busy={busy}>
          <HouseholdCreationFields form={form} disabled={busy || created} />
          <HouseholdCreationHighlights />
          {created && <p role="status">Đang cập nhật thông tin nhà cho tài khoản của bạn.</p>}
          <Button type="submit" disabled={busy || !token} className="household-create-submit">
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
