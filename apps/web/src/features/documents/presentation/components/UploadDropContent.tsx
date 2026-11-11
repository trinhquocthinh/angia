import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';

const FORMATS = ['JPG', 'PNG', 'HEIC', 'WebP'];
const HINT = 'mt-1 max-w-lg text-[15px] leading-6 text-text-secondary';

// Phần hiển thị trong vùng thả ảnh; `group` nằm ở nhãn bao ngoài (UploadDropZone).
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
        className={`relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm transition-[translate] duration-200 ease-out motion-reduce:transition-none ${
          over ? '-translate-y-1' : disabled ? '' : 'group-hover:-translate-y-0.5'
        }`}
      >
        {over && (
          <span aria-hidden="true" className="upload-drop-halo absolute inset-0 rounded-2xl bg-accent/25" />
        )}
        <DocumentIcon name="upload" size={32} />
      </span>
      <span className="auth-heading text-[22px] leading-7 font-semibold text-balance text-accent">
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
        <>
          <span className={HINT}>Tối đa 30 MB mỗi ảnh, ảnh được che và nén trên máy trước khi gửi</span>
          <span className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] leading-4 font-medium text-text-secondary">
            {FORMATS.map((format) => (
              <span key={format} className="rounded-full bg-accent-soft px-2 py-0.5">
                {format}
              </span>
            ))}
            <span className="ml-1 text-text-secondary">Tối đa {MAX_FILES_PER_PICK} ảnh mỗi lần chọn</span>
          </span>
        </>
      )}
      <span
        className={`mt-5 flex min-h-11 items-center gap-2 rounded-full bg-accent-soft px-6 text-sm font-semibold text-accent transition-colors duration-200 motion-reduce:transition-none ${
          disabled ? '' : 'group-hover:bg-accent-hover group-hover:text-on-accent'
        }`}
      >
        <DocumentIcon name="image" /> Duyệt ảnh từ thiết bị
      </span>
    </>
  );
}
