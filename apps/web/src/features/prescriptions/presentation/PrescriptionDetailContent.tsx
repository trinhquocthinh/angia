import type { PrescriptionListItem } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { usePrescriptionDetail } from '../application/usePrescriptionDetail';
import { createPrescriptionRepository } from '../infrastructure/createPrescriptionRepository';
import { PrescriptionDetailView } from './PrescriptionDetailView';
import { PrescriptionLoadState } from './PrescriptionLoadState';

const repository = createPrescriptionRepository();
type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  prescriptionId: string;
  chain: PrescriptionListItem[];
  refreshChain: () => void;
};
export function PrescriptionDetailContent({ profile, session, prescriptionId, chain, refreshChain }: Props) {
  const detail = usePrescriptionDetail(repository, session, profile, prescriptionId);
  const data = detail.data;
  const previous = chain.find((entry) => entry.id === data?.previousId);
  // Hai lần đọc có thể gặp một đơn mới/xóa xen giữa; không dựng so sánh với ngày đơn cũ.
  const inconsistent = data?.previousId && !previous;
  if (!data || inconsistent)
    return (
      <PrescriptionLoadState
        error={detail.error ?? (inconsistent ? new Error('Chuỗi đơn đã thay đổi') : undefined)}
        retry={() => {
          refreshChain();
          void detail.refetch();
        }}
      />
    );
  return <PrescriptionDetailView data={data} previousDate={previous?.issuedDate ?? null} />;
}
