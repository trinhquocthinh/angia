import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { UploadDropIcon } from './UploadDropIcon';

const FORMATS = ['JPG', 'PNG', 'HEIC', 'WebP'];
const HINT = 'mt-1 max-w-lg text-[15px] leading-6 text-[#404945]';
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
      <UploadDropIcon over={over} disabled={disabled} />
      <span className="auth-heading text-[22px] leading-7 font-semibold text-balance text-[#004135]">
        {over ? (
          'Thả ảnh vào đây'
        ) : disabled ? (
          blockedReason ? (
            'Chưa chọn thêm được ảnh'
          ) : (
            'Đang gửi ảnh…'
          )
        ) : (
          <>
            {/* Màn hình cảm ứng không kéo thả được nên không nhắc "Kéo". */}
            <span className="pointer-coarse:hidden">
              Kéo ảnh vào đây hoặc{' '}
              <span className="whitespace-nowrap text-[#286958] underline underline-offset-4">Chọn ảnh</span>
            </span>
            <span className="hidden pointer-coarse:inline">Chọn ảnh giấy tờ</span>
          </>
        )}
      </span>
      {disabled ? (
        <span className={HINT}>{blockedReason ?? 'Chờ gửi xong rồi chọn thêm.'}</span>
      ) : (
        <>
          <span className={HINT}>Tối đa 30 MB mỗi ảnh, ảnh được che và nén trên máy trước khi gửi</span>
          <span className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs leading-4 font-medium text-[#404945]">
            {FORMATS.map((format) => (
              <span key={format} className="rounded-full bg-[#e4f0f0] px-2 py-0.5">
                {format}
              </span>
            ))}
            <span className="ml-1 text-[#55615f]">Tối đa {MAX_FILES_PER_PICK} ảnh mỗi lần chọn</span>
          </span>
          <span className="mt-5 flex min-h-11 items-center gap-2 rounded-full bg-[#eaf6f5] px-6 text-sm font-semibold text-[#004135] transition-colors duration-200 group-hover:bg-[#004135] group-hover:text-white motion-reduce:transition-none">
            <DocumentIcon name="image" /> Chọn ảnh từ máy
          </span>
        </>
      )}
    </>
  );
}
