import { AdminRequestError } from '@src/features/family/application/AdminRequestError';

export function AiRoutingFormActions({
  pending,
  error,
  onCancel,
  onReload,
}: {
  pending: boolean;
  error: Error | null;
  onCancel(): void;
  onReload(): void;
}) {
  const conflict = error instanceof AdminRequestError && error.code === 'ERR_AI_ROUTING_CONFLICT';
  return (
    <div className="grid gap-2">
      {error && (
        <p role="alert" className="m-0 rounded-xl bg-danger-soft px-3 py-2 text-[12px] leading-5 text-danger">
          {error instanceof AdminRequestError
            ? error.message
            : 'Không thể kết nối. Bản đang sửa vẫn được giữ lại.'}
        </p>
      )}
      {conflict && (
        <button
          type="button"
          onClick={onReload}
          className="min-h-11 rounded-xl border border-accent bg-surface px-3 py-2 text-[12px] font-semibold text-accent cursor-pointer"
        >
          Bỏ bản sửa và tải cấu hình mới
        </button>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-border bg-surface px-3 text-[13px] font-semibold text-text-secondary cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="min-h-11 rounded-xl border-0 bg-accent px-3 py-2 text-[13px] font-semibold text-on-accent cursor-pointer hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? 'Đang xử lý…' : 'Lưu cấu hình'}
        </button>
      </div>
    </div>
  );
}
