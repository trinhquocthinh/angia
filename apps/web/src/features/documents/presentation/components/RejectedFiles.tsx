import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const reason = ({ problem, file }: UploadItem) =>
  problem === 'too_large'
    ? `Dung lượng vượt quá 30 MB (${megabytes(file.size)})`
    : problem === 'not_compressible'
      ? `Trình duyệt không nén được ảnh này, vượt quá 10 MB (${megabytes(file.size)})`
      : 'Chỉ nhận ảnh JPG, PNG, HEIC, WebP';

export function RejectedFiles({
  items,
  validCount,
  onDismiss,
}: {
  items: UploadItem[];
  validCount: number;
  onDismiss: () => void;
}) {
  const rejected = items.filter((item) => item.status === 'rejected');
  if (rejected.length === 0) return null;
  return (
    <section role="alert" className="flex flex-col gap-2 rounded-xl bg-[#ffdad6]/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ba1a1a] text-white">
            <DocumentIcon name="warning" size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-[#93000a]">
              {rejected.length} tệp không nhận được
              {validCount > 0 && ` · ${validCount} ảnh còn lại vẫn được tải bình thường`}
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-[#404945]">
              Các tệp này không được gửi đi. Chụp lại hoặc chọn ảnh khác nếu cần.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo tệp bị loại"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#404945] hover:text-[#ba1a1a]"
        >
          <DocumentIcon name="close" />
        </button>
      </div>
      <ul className="flex flex-col gap-2 sm:pl-11">
        {rejected.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-[13px]"
          >
            <span className="text-[#ba1a1a]">
              <DocumentIcon name="file" size={18} />
            </span>
            <span className="min-w-0 break-all font-medium text-[#131d1d]">{item.file.name}</span>
            <span className="rounded-full bg-[#ffdad6] px-2 py-0.5 text-[11px] font-medium text-[#ba1a1a]">
              {reason(item)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
