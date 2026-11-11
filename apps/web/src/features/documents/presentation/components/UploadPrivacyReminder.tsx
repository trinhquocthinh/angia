import '@src/shared/ui/modal-motion.css';
import { useEffect, useRef, useState } from 'react';
import { PrivacyExampleIllustration } from './PrivacyExampleIllustration';

const SENSITIVE_ITEMS = [
  'Họ tên, ngày sinh',
  'Địa chỉ, số điện thoại',
  'Mã bệnh nhân, mã hồ sơ, số bảo hiểm y tế',
  'Số CCCD, mã vạch hoặc mã QR trên giấy',
];

type Props = { onClose: (dontRemind: boolean) => void };

// BR-041 bổ sung 2026-10-12: popup nhắc trước khi tải ảnh. Escape/đóng = đã hiểu cho lần này.
// Không tuyên bố hệ thống tự phát hiện định danh — việc che vẫn do người dùng làm ở bước kiểm tra.
export function UploadPrivacyReminder({ onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [dontRemind, setDontRemind] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="upload-privacy-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose(dontRemind);
      }}
      className="angia-modal m-auto max-h-[calc(100dvh-32px)] w-[min(560px,calc(100vw-32px))] overflow-y-auto rounded-[20px] border-0 bg-surface p-6 text-text-primary shadow-[0_24px_80px_color-mix(in_srgb,var(--color-shadow)_15%,transparent)] backdrop:bg-overlay/35 max-[600px]:p-5"
    >
      <div className="flex flex-col gap-4">
        <h2 id="upload-privacy-title" className="auth-heading text-2xl font-semibold text-accent">
          Trước khi chụp và tải ảnh
        </h2>
        <p className="text-[15px] leading-6 text-text-secondary">
          Chỉ chụp phần <strong>thuốc, chỉ số và ngày</strong>. Không để thông tin cá nhân trong ảnh, vì ảnh
          sẽ được gửi tới dịch vụ tự động nhận diện để đọc chữ.
        </p>
        <PrivacyExampleIllustration />
        <div>
          <h3 className="text-sm font-bold text-accent">Không chụp các thông tin sau</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-6 text-text-secondary">
            {SENSITIVE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="rounded-xl bg-accent-soft p-3 text-sm leading-6 text-accent">
          Lỡ chụp? Bạn vẫn cắt hoặc che được ở bước kiểm tra trước khi gửi tự động nhận diện.
        </p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={dontRemind}
            onChange={(event) => setDontRemind(event.target.checked)}
            className="h-5 w-5 accent-accent"
          />
          Không nhắc lại trên thiết bị này
        </label>
        <button
          type="button"
          autoFocus
          onClick={() => onClose(dontRemind)}
          className="min-h-12 rounded-xl bg-accent px-5 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Tôi đã hiểu
        </button>
      </div>
    </dialog>
  );
}
