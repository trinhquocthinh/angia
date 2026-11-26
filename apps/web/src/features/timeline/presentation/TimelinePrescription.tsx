import type { TimelineEvent } from '@angia/contracts';
import { Link } from '@tanstack/react-router';

type Data = Extract<TimelineEvent, { kind: 'prescription' }>['data'];

export function TimelinePrescription({ data, profileId }: { data: Data; profileId: string | undefined }) {
  return (
    <>
      {data.facility && (
        <p className="text-body font-semibold text-text-primary">Nơi khám: {data.facility}</p>
      )}
      {data.diagnosis && <p className="text-text-secondary">Chẩn đoán trên đơn: {data.diagnosis}</p>}
      <p className="tabular-nums">{data.itemCount} dòng thuốc</p>
      {data.diffSummary !== null && (
        <p className="rounded-xl border border-border/30 bg-bg px-3 py-2 text-caption text-text-secondary tabular-nums">
          So với đơn trước — Thêm: {data.diffSummary.added} · Bỏ: {data.diffSummary.removed} · Thay đổi:{' '}
          {data.diffSummary.changed}
        </p>
      )}
      {profileId && (
        <div className="pt-1">
          <Link
            to="/profiles/$profileId/prescriptions/$prescriptionId"
            params={{ profileId, prescriptionId: data.prescriptionId }}
            className="inline-flex min-h-11 items-center rounded-xl border border-border/45 bg-bg px-3.5 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            Xem đơn thuốc
          </Link>
        </div>
      )}
    </>
  );
}
