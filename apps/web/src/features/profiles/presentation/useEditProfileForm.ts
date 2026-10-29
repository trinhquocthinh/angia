import { useState } from 'react';
import type { HealthProfile, UpdateProfileRequest } from '../application/ports';
import { currentVietnamYear } from '../application/currentVietnamYear';
import { readEditProfileDraft } from '../application/readEditProfileDraft';
export function useEditProfileForm(
  profile: HealthProfile,
  save: (body: UpdateProfileRequest) => Promise<boolean>,
  onClose: () => void,
) {
  const [birthYear, setBirthYear] = useState(profile.birthYear?.toString() ?? '');
  const [vitalsEnabled, setVitalsEnabled] = useState(profile.vitalsEnabled === true);
  const [yearError, setYearError] = useState<string | null>(null);
  const submit = async () => {
    const draft = readEditProfileDraft(birthYear, vitalsEnabled, currentVietnamYear());
    setYearError(draft.error);
    if (draft.body && (await save(draft.body))) onClose();
  };
  return {
    birthYear,
    vitalsEnabled,
    yearError,
    onBirthYearChange: setBirthYear,
    onVitalsChange: setVitalsEnabled,
    onSubmit: () => void submit(),
  };
}
