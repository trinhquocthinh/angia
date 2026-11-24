import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { EmailSettingsState } from '@src/features/account/application/emailSettingsState';
import type { AccountEmailStatus, ChangeAccountEmailBody } from '@src/features/account/application/ports';
import { AccountEmailBadge } from '@src/features/account/presentation/settings/AccountEmailBadge';
import { AccountEmailForm } from '@src/features/account/presentation/settings/AccountEmailForm';
import { AccountEmailRow } from '@src/features/account/presentation/settings/AccountEmailRow';
import { AccountSettings3DIcon } from '@src/features/account/presentation/settings/AccountSettings3DIcon';
import { AccountSettingsIcon } from '@src/features/account/presentation/settings/AccountSettingsIcon';

type Props = {
  emailStatus: AccountEmailStatus;
  state: EmailSettingsState;
  form: UseFormReturn<ChangeAccountEmailBody>;
  editing: boolean;
  formError: string | null;
  verifyBusy: boolean;
  verifyNotice: string | null;
  verifyError: string | null;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSubmitForm: FormEventHandler<HTMLFormElement>;
  onVerify: () => void;
};

export function AccountEmailCard({ emailStatus, state, editing, verifyBusy, ...props }: Props) {
  return (
    <section className="account-card account-email-card" aria-labelledby="account-email-heading">
      <div className="account-card-header">
        <div className="account-card-title-group">
          <AccountSettings3DIcon name="mail-3d" />
          <h2 id="account-email-heading" className="account-card-title">
            Email
          </h2>
        </div>
        <AccountEmailBadge emailStatus={emailStatus} />
      </div>
      <AccountEmailRow
        emailStatus={emailStatus}
        state={state}
        editing={editing}
        verifyBusy={verifyBusy}
        onOpenForm={props.onOpenForm}
        onVerify={props.onVerify}
      />
      {props.verifyNotice && (
        <p role="status" aria-live="polite" className="account-verify-status">
          <AccountSettingsIcon name="mark_email_read" className="account-icon-md" />
          <span>{props.verifyNotice}</span>
        </p>
      )}
      {props.verifyError && (
        <p role="alert" className="account-verify-alert">
          <AccountSettingsIcon name="error" className="account-icon-md" />
          <span>{props.verifyError}</span>
        </p>
      )}
      {editing && (
        <AccountEmailForm
          form={props.form}
          error={props.formError}
          onSubmit={props.onSubmitForm}
          onCancel={props.onCloseForm}
        />
      )}
      {state.notice && (
        <p className="account-warning-note">
          <AccountSettingsIcon name="info" className="account-icon-md" />
          <span>{state.notice}</span>
        </p>
      )}
    </section>
  );
}
