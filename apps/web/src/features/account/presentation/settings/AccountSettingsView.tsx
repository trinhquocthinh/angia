import type { components } from '@src/shared/api/schema.gen';
import { buildAccountProfileModel } from '@src/features/account/application/accountProfileModel';
import { buildEmailSettingsState } from '@src/features/account/application/emailSettingsState';
import type { ExportableProfile } from '@src/features/account/application/ports';
import { useAccountEmailForm } from '@src/features/account/application/useAccountEmailForm';
import { submitAccountEmailChange } from '@src/features/account/infrastructure/submitAccountEmailChange';
import { submitEmailVerificationRequest } from '@src/features/account/infrastructure/submitEmailVerificationRequest';
import { AccountDataDeleteSection } from '@src/features/account/presentation/settings/AccountDataDeleteSection';
import { AccountEmailCard } from '@src/features/account/presentation/settings/AccountEmailCard';
import { AccountPasswordCard } from '@src/features/account/presentation/settings/AccountPasswordCard';
import { AccountProfileCard } from '@src/features/account/presentation/settings/AccountProfileCard';
import { AccountThemeCard } from '@src/features/account/presentation/settings/AccountThemeCard';
import './account-settings.css';
import './account-profile-theme.css';
import './account-email.css';
import './account-data-export.css';
import './account-delete.css';

type Props = {
  session: components['schemas']['MeContextResponse'];
  profiles?: readonly ExportableProfile[];
  onRefreshSession: () => Promise<void>;
  onAccountDeleted?: () => Promise<void> | void;
  initialEditing?: boolean;
};

export function AccountSettingsView({
  session,
  profiles = [],
  onRefreshSession,
  onAccountDeleted = () => window.location.assign('/login'),
  initialEditing = false,
}: Props) {
  const profile = buildAccountProfileModel(session);
  const emailState = buildEmailSettingsState(session.emailStatus, session.family);
  const email = useAccountEmailForm({
    csrfToken: session.csrfToken,
    submitEmail: submitAccountEmailChange,
    submitVerify: submitEmailVerificationRequest,
    onRefreshSession,
    initialEditing,
  });

  return (
    <div className="account-settings">
      <h1 className="account-settings-heading">Tài khoản</h1>
      <AccountProfileCard profile={profile} />
      <AccountEmailCard
        emailStatus={session.emailStatus}
        state={emailState}
        form={email.form}
        editing={email.editing}
        formError={email.formError}
        verifyBusy={email.verifyBusy}
        verifyNotice={email.verifyNotice}
        verifyError={email.verifyError}
        onOpenForm={email.openForm}
        onCloseForm={email.closeForm}
        onSubmitForm={email.submit}
        onVerify={email.requestVerification}
      />
      <div className={session.hasLocalCredential ? 'account-bento-grid' : 'account-bento-single'}>
        {session.hasLocalCredential && <AccountPasswordCard />}
        <AccountThemeCard />
      </div>
      <AccountDataDeleteSection session={session} profiles={profiles} onAccountDeleted={onAccountDeleted} />
    </div>
  );
}
