import type { TimelineEvent } from '@angia/contracts';
import { Link } from '@tanstack/react-router';

type Data = Extract<TimelineEvent, { kind: 'prescription' }>['data'];

export function TimelinePrescription({ data, profileId }: { data: Data; profileId: string }) {
  return (
    <>
      {data.facility && <p>Nơi khám: {data.facility}</p>}
      {data.diagnosis && <p>Chẩn đoán trên đơn: {data.diagnosis}</p>}
      <p>{data.itemCount} dòng thuốc</p>
      {data.diffSummary !== null && (
        <p>
          So với đơn trước — Thêm: {data.diffSummary.added} · Bỏ: {data.diffSummary.removed} · Thay đổi:{' '}
          {data.diffSummary.changed}
        </p>
      )}
      <Link
        to="/profiles/$profileId/prescriptions/$prescriptionId"
        params={{ profileId, prescriptionId: data.prescriptionId }}
        className="inline-flex min-h-11 items-center font-semibold text-[#004135] underline underline-offset-4"
      >
        Xem đơn thuốc
      </Link>
    </>
  );
}
