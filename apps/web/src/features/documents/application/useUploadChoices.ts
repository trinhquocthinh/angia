import { useState } from 'react';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { DocumentType } from './ports';

const typeFor = (profile: HealthProfile | undefined, type: DocumentType | null) =>
  profile && !profileShowsVitals(profile) && type === 'device_reading' ? null : type;

// Hồ sơ và loại giấy tờ đang chọn ở /upload: hồ sơ không theo dõi số đo thì không giữ lựa chọn "Máy đo cá nhân".
export function useUploadChoices(profiles: HealthProfile[]) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [declaredType, setDeclaredType] = useState<DocumentType | null>(null);
  const ready = profiles.find((profile) => profile.id === profileId && profile.consentStatus === 'confirmed');
  const selectProfile = (id: string) => {
    setProfileId(id);
    setDeclaredType(
      typeFor(
        profiles.find((profile) => profile.id === id),
        declaredType,
      ),
    );
  };
  return { ready, selectedType: typeFor(ready, declaredType), selectProfile, setDeclaredType };
}
