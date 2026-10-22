import { DocumentIcon } from './DocumentIcon';

type NoMaskWarningProps = { busy: boolean; onBack: () => void; onSendAnyway: () => void };

// BR-041 bổ sung 2026-10-12: bản kiểm tra không có vùng che nào thì hỏi lại trước khi gửi AI.
// Kiểu cảnh báo nội tuyến cam như cảnh báo trùng chứng từ; lời lẽ trung tính, không hù doạ.
export function NoMaskWarning({ busy, onBack, onSendAnyway }: NoMaskWarningProps) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl bg-[#ffdbc9] p-4 text-[#321200]">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#833b00] text-[#ffdbc9]"
      >
        <DocumentIcon name="warning" size={16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 text-sm leading-6">
        <p>
          <strong className="font-semibold">Ảnh chưa có vùng che nào.</strong> Nếu trên ảnh còn họ tên, ngày
          sinh, địa chỉ, số điện thoại, mã bệnh nhân hoặc số bảo hiểm y tế, hãy che trước khi gửi để tự động
          nhận diện.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onBack}
            className="min-h-11 rounded-lg bg-[#602900] px-4 text-sm font-semibold text-white disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602900]"
          >
            Quay lại che thông tin
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSendAnyway}
            className="min-h-11 rounded-lg border border-[#602900] px-4 text-sm font-semibold text-[#602900] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602900]"
          >
            Ảnh không có thông tin cá nhân — vẫn gửi
          </button>
        </div>
      </div>
    </div>
  );
}
