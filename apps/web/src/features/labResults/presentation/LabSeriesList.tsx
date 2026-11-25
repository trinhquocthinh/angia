import { Link } from '@tanstack/react-router';
import type { LabSeries } from '@angia/contracts';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { groupLabSeries } from '../application/groupLabSeries';
import { LabGroupChips } from './LabGroupChips';
import { LabGroupSection } from './LabGroupSection';

type Props = {
  data: LabSeries[] | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
  /** Tự xem (SPEC-042): trạng thái rỗng không mời ghi dữ liệu. */
  readOnly?: boolean;
};

// Design §6 "Kết quả cận lâm sàng" + LG-01 theo 3D Bento v2.0.
export function LabSeriesList({ data, loading, error, retry, readOnly = false }: Props) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải kết quả xét nghiệm" className="grid gap-4 md:grid-cols-2">
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
        <p>Không tải được kết quả xét nghiệm.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
        >
          Thử lại
        </button>
      </div>
    );
  if (data.length === 0)
    return (
      <div className="profile-bento-card flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center">
        <ProfileSectionIcon name="science" size={56} />
        <p className="text-body font-semibold text-text-primary">Chưa có kết quả xét nghiệm nào.</p>
        {!readOnly && (
          <Link
            to="/upload"
            className="inline-flex min-h-btn items-center rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent"
          >
            Tải ảnh phiếu xét nghiệm
          </Link>
        )}
      </div>
    );
  const groups = groupLabSeries(data);
  return (
    <div className="flex flex-col gap-5">
      {groups.length >= 2 && <LabGroupChips groups={groups} />}
      {groups.map((group) => (
        <LabGroupSection key={group.id} group={group} />
      ))}
      <p className="text-caption text-text-secondary">
        Nhóm và ghi chú chỉ để tra cứu nhanh, không thay lời bác sĩ.
      </p>
    </div>
  );
}
