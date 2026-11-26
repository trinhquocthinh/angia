import type { ReactNode } from 'react';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import type { ApproveDocumentRequest } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { DocumentIcon } from './DocumentIcon';
import { ManualEntryForm } from './ManualEntryForm';
import { ReviewNotice } from './ReviewNotice';

type ManualRecordContentProps = {
  profile: HealthProfile | null;
  saved: boolean;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
  /** Cảnh báo dưới form, vd. nghi trùng bản đã lưu (SPEC-012). */
  notice?: ReactNode;
  formDisabled?: boolean;
  onAgain: () => void;
  onBack: () => void;
};

const buttonClass =
  'inline-flex min-h-btn items-center justify-center rounded-2xl px-5 text-button-secondary font-semibold transition-colors';

function ManualSavedCard({
  displayName,
  onAgain,
  onBack,
}: {
  displayName: string;
  onAgain: () => void;
  onBack: () => void;
}) {
  return (
    <section
      className="doc-bento-card mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-3xl p-6 sm:p-8"
      role="status"
    >
      <div className="flex items-start gap-4">
        <span className="doc-clay-emblem text-accent">
          <DocumentIcon name="checkCircle" size={28} />
        </span>
        <div className="min-w-0">
          <h2 className="auth-heading text-heading-2 font-semibold text-accent">Đã lưu vào sổ</h2>
          <p className="mt-1 text-caption leading-relaxed text-text-secondary">
            Dữ liệu của {displayName} được ghi là nhập tay, không kèm ảnh giấy tờ gốc.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-border/30 pt-4">
        <button
          type="button"
          onClick={onAgain}
          className={`${buttonClass} bg-accent text-on-accent shadow-stitch-sm hover:bg-accent-hover`}
        >
          Nhập thêm
        </button>
        <button
          type="button"
          onClick={onBack}
          className={`${buttonClass} bg-accent-soft text-accent hover:bg-border/40`}
        >
          Về hồ sơ
        </button>
      </div>
    </section>
  );
}

// SPEC-011 không kèm ảnh: chỉ hồ sơ đã đồng thuận (BR-009); bản ghi gắn cờ nhập tay (BR-014).
export function ManualRecordContent({
  profile,
  saved,
  notice,
  formDisabled = false,
  onAgain,
  onBack,
  ...form
}: ManualRecordContentProps) {
  if (!profile)
    return <ReviewNotice title="Không tìm thấy hồ sơ" body="Không tìm thấy hồ sơ này trong gia đình." />;
  if (profile.consentStatus !== 'confirmed')
    return (
      <ReviewNotice
        title="Hồ sơ chưa được đồng ý lưu dữ liệu"
        body="Gửi link mời để người thân hoặc người chăm sóc xác nhận trước khi nhập dữ liệu sức khỏe."
      />
    );
  if (saved) return <ManualSavedCard displayName={profile.displayName} onAgain={onAgain} onBack={onBack} />;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-6">
      <header className="doc-bento-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="doc-clay-emblem">
            <ProfileSectionIcon name="edit_note" size={40} />
          </span>
          <div className="min-w-0">
            <h1 className="auth-heading text-heading-1 font-semibold text-accent">
              Nhập tay cho {profile.displayName}
            </h1>
            <p className="mt-1 text-caption text-text-secondary">
              Lưu trực tiếp vào sổ sức khỏe, không kèm ảnh giấy tờ gốc.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border/40 bg-bg px-4 text-caption font-semibold text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent"
        >
          <span className="-scale-x-100">
            <DocumentIcon name="arrow" size={16} />
          </span>
          <span>Về hồ sơ</span>
        </button>
      </header>
      <fieldset disabled={formDisabled} className="min-w-0 border-0 p-0">
        <ManualEntryForm
          key={profile.id}
          allowReading={profileShowsVitals(profile)}
          initialType={null}
          intro="Dữ liệu được ghi là nhập tay, không kèm ảnh giấy tờ gốc. Nhập đúng như trên giấy tờ hoặc màn hình máy đo."
          {...form}
        />
      </fieldset>
      {notice}
    </div>
  );
}
