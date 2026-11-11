import { useState } from 'react';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import type { DocumentType } from './ports';
import { resolveUploadProfile } from './resolveUploadProfile';

/** Hồ sơ nhận ảnh và loại giấy tờ ở trang Tải lên; hồ sơ ẩn số đo (BR-049) thì bỏ chọn "số đo máy". */
export function useUploadProfileChoice(profiles: HealthProfile[]) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [declaredType, setDeclaredType] = useState<DocumentType | null>(null);
  const ready = resolveUploadProfile(profiles, profileId);
  const chooseProfile = (id: string) => {
    setProfileId(id);
    const next = profiles.find((profile) => profile.id === id);
    if (next && !profileShowsVitals(next) && declaredType === 'device_reading') setDeclaredType(null);
  };
  const selectedType =
    ready && !profileShowsVitals(ready) && declaredType === 'device_reading' ? null : declaredType;
  return { ready, chooseProfile, selectedType, setDeclaredType };
}
