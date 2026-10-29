import type { FamilyUsage } from '@angia/contracts';
import { useState } from 'react';
import { redactionConfirmDecision, type UploadChoice } from '../../application/redactionConfirmDecision';
import { NoMaskWarning } from './NoMaskWarning';
import { RedactionChoices } from './RedactionChoices';

type Props = {
  previewUrl: string;
  maskCount: number;
  /** SPEC-031: hết lượt/ngân sách → gửi AI chỉ còn là xếp hàng chờ. */
  aiExhausted: boolean;
  aiReason?: FamilyUsage['aiOcr']['reason'];
  /** BR-043: hàng chờ tự động nhận diện đã đủ → khóa lựa chọn gửi AI. */
  aiBlockedReason: string | null;
  onBack: () => void;
  onConfirm: (sendToAi: boolean) => void;
};

// KH-2 §3 bước 3: hiện đúng JPEG sẽ gửi; chưa chọn sẵn cách xử lý để không bao giờ ngầm đồng ý gửi AI.
export function RedactionConfirmStep({ previewUrl, maskCount, onBack, onConfirm, ...ai }: Props) {
  const [choice, setChoice] = useState<UploadChoice | null>(null);
  const [checked, setChecked] = useState(false);
  const [asking, setAsking] = useState(false);
  const aiBlocked = ai.aiBlockedReason !== null;
  const decision = redactionConfirmDecision({
    choice,
    checked,
    aiBlocked,
    maskCount,
    acknowledgedNoMask: false,
  });
  const submit = () => {
    if (decision === 'ask-no-mask') setAsking(true);
    if (decision === 'confirm') onConfirm(choice === 'ai');
  };
  return (
    <section
      aria-label="Xem bản sẽ tải lên"
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm lg:p-6"
    >
      <h3 className="text-lg font-bold text-[#004135]">Xem bản sẽ tải lên</h3>
      <img
        src={previewUrl}
        alt="Bản đã che sẽ được tải lên"
        className="max-h-[52dvh] w-full rounded-xl bg-[#131d1d] object-contain"
      />
      <p className="text-[13px] leading-5 text-[#404945]">
        Đây là đúng ảnh sẽ được gửi đi. AN GIA không nhận ảnh chưa che.
      </p>
      <RedactionChoices
        {...ai}
        choice={choice}
        checked={checked}
        onChoice={setChoice}
        onChecked={setChecked}
      />
      {asking && (
        <NoMaskWarning busy={false} onBack={onBack} onSendAnyway={() => onConfirm(choice === 'ai')} />
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#404945] hover:bg-[#e4f0f0]"
        >
          Quay lại che
        </button>
        <button
          type="button"
          disabled={decision === 'disabled'}
          onClick={submit}
          className="min-h-11 rounded-xl bg-[#004135] px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Xác nhận
        </button>
      </div>
    </section>
  );
}
