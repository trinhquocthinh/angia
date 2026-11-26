import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';

const FORMATS = ['JPG', 'PNG', 'HEIC', 'WebP'];
const HINT = 'mt-1 max-w-lg text-caption text-text-secondary';

function UploadFormats() {
  return (
    <>
      <span className={HINT}>Tối đa 30 MB mỗi ảnh, ảnh được che và nén trên máy trước khi gửi</span>
      <span className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-caption font-semibold text-text-secondary">
        {FORMATS.map((format) => (
          <span key={format} className="rounded-full bg-surface-container px-2.5 py-0.5 text-accent">
            {format}
          </span>
        ))}
        <span className="ml-1 font-medium text-text-secondary">
          Tối đa {MAX_FILES_PER_PICK} ảnh mỗi lần chọn
        </span>
      </span>
    </>
  );
}

// Phần hiển thị trong vùng thả ảnh theo Stitch 3D Bento v2.0; `group` nằm ở nhãn bao ngoài (UploadDropZone).
export function UploadDropContent({
  over,
  disabled,
  blockedReason,
}: {
  over: boolean;
  disabled: boolean;
  blockedReason: string | null;
}) {
  return (
    <>
      <span
        className={`doc-clay-emblem relative mb-3 transition-[translate] duration-200 ease-out motion-reduce:transition-none ${
          over ? '-translate-y-1' : disabled ? '' : 'group-hover:-translate-y-0.5'
        }`}
      >
        {over && (
          <span
            aria-hidden="true"
            className="upload-drop-halo absolute inset-0 rounded-[20px] bg-accent/20"
          />
        )}
        <ProfileSectionIcon name="folder_open" size={40} />
      </span>
      <span className="auth-heading text-heading-2 font-semibold text-balance text-accent">
        {over ? (
          'Thả ảnh vào đây'
        ) : (
          <>
            Kéo ảnh vào đây hoặc{' '}
            <span className="whitespace-nowrap text-accent underline underline-offset-4">Chọn ảnh</span>
          </>
        )}
      </span>
      {disabled ? (
        <span className={HINT}>{blockedReason ?? 'Đang gửi ảnh, chờ gửi xong rồi chọn thêm.'}</span>
      ) : (
        <UploadFormats />
      )}
      <span
        className={`mt-5 inline-flex min-h-btn items-center gap-2 rounded-2xl bg-accent-soft px-6 text-button-secondary font-semibold text-accent shadow-stitch-sm transition-colors duration-200 motion-reduce:transition-none ${
          disabled ? '' : 'group-hover:bg-accent group-hover:text-on-accent'
        }`}
      >
        <AdminIcon name="add_a_photo" size={20} /> Duyệt ảnh từ thiết bị
      </span>
    </>
  );
}
