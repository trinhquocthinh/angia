import { Link } from '@tanstack/react-router';
import type { Prescription, PrescriptionDetail, PrescriptionListItem } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { documentImageUrl } from '@src/features/documents/infrastructure/createReviewRepository';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { PrescriptionItems } from './PrescriptionItems';
import { PrescriptionComparison } from './PrescriptionComparison';
import { PrescriptionNavigation } from './PrescriptionNavigation';

function PrescriptionHeroCard({ prescription }: { prescription: Prescription }) {
  return (
    <section className="profile-bento-card flex min-w-0 flex-col gap-4 p-5 break-words sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
            <ProfileSectionIcon name="receipt_long" size={38} />
          </span>
          <div className="min-w-0">
            <h2 className="auth-heading text-heading-2 font-semibold text-accent">
              Đơn ngày {formatDay(prescription.issuedDate)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-caption">
              <span className="rounded-full bg-secondary-container px-3 py-0.5 font-semibold text-on-secondary-container">
                {prescription.sourceDocumentId ? 'Từ giấy tờ' : 'Nhập tay'}
              </span>
              {prescription.revisitDate && (
                <span className="rounded-full bg-accent-soft px-3 py-0.5 font-semibold text-accent tabular-nums">
                  Ngày hẹn: {formatDay(prescription.revisitDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        {prescription.sourceDocumentId && (
          <a
            href={documentImageUrl(prescription.sourceDocumentId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-btn shrink-0 items-center justify-center rounded-2xl bg-accent px-5 text-button-secondary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover"
          >
            Xem ảnh giấy tờ (mở tab mới)
          </a>
        )}
      </div>
      {(prescription.facility || prescription.diagnosis) && (
        <div className="flex flex-col gap-1.5 rounded-2xl border border-border/35 bg-bg p-4 text-body">
          {prescription.facility && <p>Nơi khám: {prescription.facility}</p>}
          {prescription.diagnosis && (
            <p className="whitespace-pre-wrap text-text-secondary">
              Chẩn đoán ghi trên đơn: {prescription.diagnosis}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function PrescriptionChainStrip({
  profileId,
  currentId,
  chain,
}: {
  profileId: string;
  currentId: string;
  chain: PrescriptionListItem[];
}) {
  if (chain.length < 2) return null;
  return (
    <nav
      aria-label="Chọn nhanh trong chuỗi đơn"
      className="profile-bento-card flex flex-wrap items-center gap-2.5 p-4 sm:px-5"
    >
      <span className="text-caption font-semibold text-text-secondary">Chuỗi đơn:</span>
      {chain.map((entry) => {
        const current = entry.id === currentId;
        return (
          <Link
            key={entry.id}
            to="/profiles/$profileId/prescriptions/$prescriptionId"
            params={{ profileId, prescriptionId: entry.id }}
            aria-current={current ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-2xl px-3.5 text-caption font-semibold tabular-nums transition-colors ${
              current
                ? 'bg-accent text-on-accent shadow-stitch-sm'
                : 'border border-border/45 bg-bg text-text-primary hover:bg-accent-soft hover:text-accent'
            }`}
          >
            {formatDay(entry.issuedDate)} ({entry.itemCount})
          </Link>
        );
      })}
    </nav>
  );
}

export function PrescriptionDetailView({
  data,
  previousDate,
  chain = [],
}: {
  data: PrescriptionDetail;
  previousDate: string | null;
  chain?: PrescriptionListItem[];
}) {
  const { prescription, previousId, nextId } = data;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PrescriptionNavigation
        profileId={prescription.healthProfileId}
        previousId={previousId}
        nextId={nextId}
      />
      <PrescriptionHeroCard prescription={prescription} />
      <PrescriptionComparison
        diff={data.diff}
        previousDate={previousDate}
        currentDate={prescription.issuedDate}
      />
      <section className="profile-bento-card min-w-0 p-5 break-words sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-3">
          <h3 className="auth-heading text-heading-2 font-semibold text-accent">
            Nội dung trên đơn · {prescription.items.length} dòng thuốc
          </h3>
        </div>
        <PrescriptionItems items={prescription.items} />
      </section>
      <PrescriptionChainStrip
        profileId={prescription.healthProfileId}
        currentId={prescription.id}
        chain={chain}
      />
    </div>
  );
}
