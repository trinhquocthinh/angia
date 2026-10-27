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
        <p
          role="alert"
          className="m-0 rounded-xl bg-[#ffdad6] px-3 py-2 text-[12px] leading-5 text-[#93000a]"
        >
          {error instanceof AdminRequestError
            ? error.message
            : 'Không thể kết nối. Bản đang sửa vẫn được giữ lại.'}
        </p>
      )}
      {conflict && (
        <button
          type="button"
          onClick={onReload}
          className="min-h-11 rounded-xl border border-[#286958] bg-white px-3 py-2 text-[12px] font-semibold text-[#286958] cursor-pointer"
        >
          Bỏ bản sửa và tải cấu hình mới
        </button>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-[#e4e0da] bg-white px-3 text-[13px] font-semibold text-[#404945] cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="min-h-11 rounded-xl border-0 bg-[#286958] px-3 py-2 text-[13px] font-semibold text-white cursor-pointer hover:bg-[#004135] disabled:opacity-60"
        >
          {pending ? 'Đang xử lý…' : 'Lưu cấu hình'}
        </button>
      </div>
    </div>
  );
}
