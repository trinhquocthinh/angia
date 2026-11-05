import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { revealStyle } from '@src/shared/ui/revealStyle';
import type { DocumentType } from '../../application/ports';
import { DocumentTypePicker } from './DocumentTypePicker';
import { ProfilePicker } from './ProfilePicker';

export function ProfileChoices({
  profiles,
  loading,
  error,
  retry,
  profileId,
  locked,
  onProfile,
  declaredType,
  onType,
}: {
  profiles: HealthProfile[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  profileId: string | null;
  locked: boolean;
  onProfile: (id: string) => void;
  declaredType: DocumentType | null;
  onType: (value: DocumentType | null) => void;
}) {
  if (loading)
    return <div className="h-36 animate-pulse rounded-xl bg-[#e4f0f0] motion-reduce:animate-none" />;
  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
        <p className="text-sm text-[#93000a]">Không tải được danh sách hồ sơ.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  }
  const profile = profiles.find((item) => item.id === profileId);
  return (
    <div
      className="angia-modal-reveal grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      style={revealStyle(3)}
    >
      <ProfilePicker profiles={profiles} selectedId={profileId} locked={locked} onSelect={onProfile} />
      <DocumentTypePicker
        value={declaredType}
        onChange={onType}
        allowDeviceReading={!profile || profileShowsVitals(profile)}
      />
    </div>
  );
}
