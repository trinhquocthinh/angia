import type { PrescriptionDetail } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { documentImageUrl } from '@src/features/documents/infrastructure/createReviewRepository';
import { PrescriptionItems } from './PrescriptionItems';
import { PrescriptionComparison } from './PrescriptionComparison';
import { PrescriptionNavigation } from './PrescriptionNavigation';

export function PrescriptionDetailView({
  data,
  previousDate,
}: {
  data: PrescriptionDetail;
  previousDate: string | null;
}) {
  const { prescription, previousId, nextId } = data;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PrescriptionNavigation
        profileId={prescription.healthProfileId}
        previousId={previousId}
        nextId={nextId}
      />
      <section className="min-w-0 rounded-[20px] bg-white p-5 break-words">
        <h2 className="text-xl font-semibold text-[#004135]">
          Đơn ngày {formatDay(prescription.issuedDate)}
        </h2>
        <p className="mt-2 text-sm text-[#55615f]">
          {prescription.sourceDocumentId ? 'Từ giấy tờ' : 'Nhập tay'}
        </p>
        {prescription.facility && <p className="mt-2 text-sm">Nơi khám: {prescription.facility}</p>}
        {prescription.diagnosis && (
          <p className="mt-2 whitespace-pre-wrap text-sm">Chẩn đoán ghi trên đơn: {prescription.diagnosis}</p>
        )}
        {prescription.revisitDate && (
          <p className="mt-2 text-sm">Ngày hẹn: {formatDay(prescription.revisitDate)}</p>
        )}
        {prescription.sourceDocumentId && (
          <a
            href={documentImageUrl(prescription.sourceDocumentId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#004135] underline underline-offset-4"
          >
            Xem ảnh giấy tờ (mở tab mới)
          </a>
        )}
        <h3 className="mt-5 mb-3 font-semibold">
          Nội dung trên đơn · {prescription.items.length} dòng thuốc
        </h3>
        <PrescriptionItems items={prescription.items} />
      </section>
      <PrescriptionComparison
        diff={data.diff}
        previousDate={previousDate}
        currentDate={prescription.issuedDate}
      />
    </div>
  );
}
