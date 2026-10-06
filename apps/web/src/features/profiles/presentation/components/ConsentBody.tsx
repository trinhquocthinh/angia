import type { ConsentBodyProps } from './ConsentBodyProps';
import { ConsentChoices } from './ConsentChoices';
export function ConsentBody({
  name,
  basis,
  pending,
  message,
  error,
  setBasis,
  confirm,
  onClose,
}: ConsentBodyProps) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id="consent-title" className="auth-heading text-2xl text-[#004135]">
          Xác nhận đồng thuận
        </h2>
        <button
          onClick={onClose}
          aria-label="Đóng xác nhận đồng thuận"
          className="h-11 w-11 shrink-0 rounded-xl bg-[#eaf6f5]"
        >
          ×
        </button>
      </div>
      <p className="mt-3 break-words text-lg font-semibold">{name}</p>
      <p id="consent-description" className="mt-5 text-sm leading-7 text-[#55615f]">
        Bạn xác nhận đối tượng hoặc người giám hộ hợp pháp đã đồng thuận chia sẻ và lưu trữ dữ liệu sức khỏe
        trong nhóm gia đình. Ảnh chứng từ có thể được gửi tới dịch vụ AI ở nước ngoài để trích xuất thông tin.
      </p>
      {!message && <ConsentChoices basis={basis} pending={pending} setBasis={setBasis} />}
      <p className="mt-5 text-sm leading-6 text-[#004135]" role="status" aria-live="polite">
        {message}
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}
      {message ? (
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-6 w-full"
          onClick={onClose}
        >
          Đóng
        </button>
      ) : (
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-6 w-full"
          disabled={!basis || pending}
          onClick={() => void confirm()}
        >
          {pending ? 'Đang ghi nhận…' : 'Xác nhận đồng thuận'}
        </button>
      )}
    </div>
  );
}
