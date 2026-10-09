import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { ApproveDocumentRequest } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { ManualEntryForm } from './ManualEntryForm';
import { ReviewNotice } from './ReviewNotice';

type ManualRecordContentProps = {
  profile: HealthProfile | null;
  saved: boolean;
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
  onAgain: () => void;
  onBack: () => void;
};

const buttonClass = 'min-h-11 rounded-full px-5 text-sm font-semibold';

// SPEC-011 không kèm ảnh: chỉ hồ sơ đã đồng thuận (BR-009); bản ghi gắn cờ nhập tay (BR-014).
export function ManualRecordContent({ profile, saved, onAgain, onBack, ...form }: ManualRecordContentProps) {
  if (!profile)
    return <ReviewNotice title="Không tìm thấy hồ sơ" body="Không tìm thấy hồ sơ này trong gia đình." />;
  if (profile.consentStatus !== 'confirmed')
    return (
      <ReviewNotice
        title="Hồ sơ chưa được đồng ý lưu dữ liệu"
        body="Gửi link mời để người có hồ sơ hoặc người giám hộ đồng ý trước khi nhập dữ liệu sức khỏe."
      />
    );
  if (saved)
    return (
      <section className="flex flex-col gap-4 rounded-[20px] bg-white p-6" role="status">
        <h2 className="text-lg font-semibold text-[#004135]">Đã lưu vào sổ</h2>
        <p className="text-sm leading-6 text-[#55615f]">
          Dữ liệu của {profile.displayName} được ghi là nhập tay, không kèm chứng từ gốc.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onAgain} className={`${buttonClass} bg-[#004135] text-white`}>
            Nhập thêm
          </button>
          <button type="button" onClick={onBack} className={`${buttonClass} bg-[#e4f0f0] text-[#004135]`}>
            Về hồ sơ
          </button>
        </div>
      </section>
    );
  return (
    <div className="flex flex-col gap-4">
      <h1 className="auth-heading text-2xl font-semibold text-[#004135]">
        Nhập tay cho {profile.displayName}
      </h1>
      <ManualEntryForm
        initialType={null}
        intro="Dữ liệu được ghi là nhập tay, không kèm chứng từ gốc. Nhập đúng như trên giấy tờ hoặc màn hình máy đo."
        {...form}
      />
    </div>
  );
}
