import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { invalidateRevisitData } from './invalidateRevisitData';
import { revisitDateFormSchema } from './revisitDateForm';
import type { RevisitPrescription, RevisitRepository } from './ports';

export function useSetRevisitDate(
  repository: Pick<RevisitRepository, 'setDate'>,
  session: ProfileSession,
  profile: HealthProfile,
  prescription: RevisitPrescription,
) {
  const client = useQueryClient();
  const sending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (revisitDate: string) => {
    if (
      sending.current ||
      session.role !== 'main' ||
      !session.csrfToken ||
      session.family?.id !== profile.familyId ||
      profile.consentStatus !== 'confirmed'
    )
      return false;
    const parsed = revisitDateFormSchema.safeParse({ issuedDate: prescription.issuedDate, revisitDate });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nhập ngày hẹn hợp lệ.');
      return false;
    }
    sending.current = true;
    setSaving(true);
    setError(null);
    try {
      await repository.setDate(profile.id, prescription.id, revisitDate || null, session.csrfToken);
      await Promise.all([
        invalidateRevisitData(client, session, profile.id),
        client.invalidateQueries({
          queryKey: ['documents', session.account.id, session.family?.id, profile.id],
        }),
      ]);
      return true;
    } catch (cause) {
      setError(
        cause instanceof MedicationRequestError ? cause.message : 'Không thể lưu ngày hẹn. Vui lòng thử lại.',
      );
      if (cause instanceof MedicationRequestError && [401, 403, 404, 409].includes(cause.status)) {
        void client.invalidateQueries({ queryKey: ['current-session'] });
        void client.invalidateQueries({ queryKey: ['profiles', session.account.id, session.family?.id] });
        void invalidateRevisitData(client, session, profile.id);
      }
      return false;
    } finally {
      sending.current = false;
      setSaving(false);
    }
  };
  return { save, saving, error };
}
