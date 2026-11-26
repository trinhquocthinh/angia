import { Link } from '@tanstack/react-router';
import type { CurrentMedications, CurrentMedicationCourse } from '@angia/contracts';
import type { ReactNode } from 'react';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { groupMedicationsBySlot } from '../application/groupMedicationsBySlot';
import { MedicationSlotSection } from './MedicationSlotSection';

type Props = {
  data: CurrentMedications | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
  /** Tự xem (SPEC-042): trạng thái rỗng không mời ghi dữ liệu. */
  readOnly?: boolean;
  renderCourseActions?: (course: CurrentMedicationCourse) => ReactNode;
};

const emptyText = (readOnly: boolean) =>
  readOnly
    ? 'Chưa có thuốc đang dùng hôm nay.'
    : 'Chưa có thuốc. Hãy tải đơn thuốc hoặc thêm thuốc bổ, vitamin.';

// Design §6 "Danh mục thuốc" theo 3D Bento v2.0: nhóm theo buổi, thẻ bo lớn, nút dùng token min-h-btn.
export function MedicationCatalog({
  data,
  loading,
  error,
  retry,
  readOnly = false,
  renderCourseActions,
}: Props) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải danh mục thuốc" className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((key) => (
          <div
            key={key}
            className="h-48 animate-pulse rounded-[24px] bg-surface motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  if (error || !data)
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-[22px] bg-danger-soft p-5 text-caption"
      >
        <p>Không tải được danh mục thuốc.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
        >
          Thử lại
        </button>
      </div>
    );
  const groups = groupMedicationsBySlot(data.courses);
  if (groups.length === 0)
    return (
      <div className="profile-bento-card flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center">
        <ProfileSectionIcon name="medication" size={56} />
        <p className="text-body font-semibold text-text-primary">{emptyText(readOnly)}</p>
        {!readOnly && (
          <Link
            to="/upload"
            className="inline-flex min-h-btn items-center rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent"
          >
            Tải ảnh đơn thuốc
          </Link>
        )}
      </div>
    );
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <MedicationSlotSection key={group.slot} {...{ group, today: data.today, renderCourseActions }} />
      ))}
    </div>
  );
}
