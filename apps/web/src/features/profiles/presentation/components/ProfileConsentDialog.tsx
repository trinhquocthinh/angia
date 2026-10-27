import type { ProfileListItem, ProfilesRepository, ProfileSession } from '../../application/ports';
import { InvitationManagerDialog } from './InvitationManagerDialog';
import { ConsentAttestationDialog } from './ConsentAttestationDialog';
type Props = {
  profile: ProfileListItem;
  repository: ProfilesRepository;
  session: ProfileSession;
  onClose: () => void;
};
export function ProfileConsentDialog(props: Props) {
  if (props.profile.consentAction === 'invitation') return <InvitationManagerDialog {...props} />;
  if (props.profile.consentAction === 'attestation' || props.profile.consentAction === 'self')
    return (
      <ConsentAttestationDialog
        key={`${props.profile.consentAction}:${props.profile.consentStatus}`}
        {...props}
      />
    );
  return null;
}
