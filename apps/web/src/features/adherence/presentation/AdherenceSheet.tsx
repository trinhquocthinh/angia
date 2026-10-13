import { useCurrentMedications } from '@src/features/medications/application/useCurrentMedications';
import { createMedicationCatalogRepository } from '@src/features/medications/infrastructure/createMedicationCatalogRepository';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { SidePanel } from '@src/shared/ui/SidePanel';
import { SidePanelFooter } from '@src/shared/ui/SidePanelFooter';
import { medicationSuggestions } from '../application/adherenceForm';
import { groupByMedication } from '../application/medicationPeriods';
import type { AdherencePeriod, AdherenceRepository } from '../application/ports';
import { useAdherencePeriods } from '../application/useAdherencePeriods';
import { useRecordAdherence } from '../application/useRecordAdherence';
import { AdherenceForm } from './AdherenceForm';
import { AdherenceSheetNotice } from './AdherenceSheetNotice';

const catalogRepository = createMedicationCatalogRepository();

type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  repository: AdherenceRepository;
  onClose: () => void;
  onSaved: (period: AdherencePeriod) => void;
};

// Bottom Sheet (mobile) / side panel (desktop) ghi nhận giai đoạn dùng thuốc thực tế (SPEC-022, US-016).
export function AdherenceSheet({ profile, session, repository, onClose, onSaved }: Props) {
  const list = useAdherencePeriods(repository, session, profile);
  const current = useCurrentMedications(catalogRepository, session, profile);
  const record = useRecordAdherence(repository, session, profile.id);
  const groups = groupByMedication(list.data?.periods ?? []);
  const currentNames = current.data?.courses.map((course) => course.name) ?? [];
  const editing = profile.consentStatus === 'confirmed' && list.isSuccess && !record.saved;
  return (
    <SidePanel
      titleId="adherence-title"
      title={`Giai đoạn dùng thuốc của ${profile.displayName}`}
      subtitle="Ghi nhận thực tế đang dùng hay đã ngưng một thuốc từ ngày nào."
      closeLabel="Đóng ghi nhận giai đoạn"
      pending={record.pending}
      onClose={onClose}
    >
      {editing ? (
        <AdherenceForm
          today={list.data.today}
          groups={groups}
          suggestions={medicationSuggestions(groups, currentNames)}
          pending={record.pending}
          error={record.error?.message ?? null}
          onSubmit={(request) => void record.submit(request, onSaved)}
          onCancel={onClose}
        />
      ) : (
        <>
          <AdherenceSheetNotice
            consented={profile.consentStatus === 'confirmed'}
            list={list}
            saved={record.saved}
          />
          <SidePanelFooter
            submitLabel={null}
            cancelLabel="Đóng"
            disabled={true}
            submit={false}
            cancelDisabled={record.pending}
            onCancel={onClose}
          />
        </>
      )}
    </SidePanel>
  );
}
