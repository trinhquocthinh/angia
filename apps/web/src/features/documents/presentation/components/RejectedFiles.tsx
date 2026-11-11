import type { UploadItem } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const reason = ({ problem, file }: UploadItem) =>
  problem === 'too_large'
    ? `Dung lượng vượt quá 30 MB (${megabytes(file.size)})`
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
    <section
      role="alert"
      className="angia-modal-reveal flex flex-col gap-2 rounded-2xl bg-danger-soft/40 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger text-on-accent">
            <DocumentIcon name="warning" size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-danger">
              {rejected.length} tệp không nhận được
              {validCount > 0 && ` · ${validCount} ảnh còn lại vẫn được tải bình thường`}
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-text-secondary">
              Các tệp này không được gửi đi. Chụp lại hoặc chọn ảnh khác nếu cần.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo tệp bị loại"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:text-danger"
        >
          <DocumentIcon name="close" />
        </button>
      </div>
      <ul className="flex flex-col gap-2 sm:pl-11">
        {rejected.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-surface/80 px-3 py-2 text-[13px]"
          >
            <span className="text-danger">
              <DocumentIcon name="file" size={18} />
            </span>
            <span className="min-w-0 break-all font-medium text-text-primary">{item.file.name}</span>
            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
              {reason(item)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
