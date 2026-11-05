import type { FamilyUsage } from '@angia/contracts';
import { useState } from 'react';
import { redactionConfirmDecision, type UploadChoice } from '../../application/redactionConfirmDecision';
import { NoMaskWarning } from './NoMaskWarning';
import { RedactionChoices } from './RedactionChoices';
import { RedactionConfirmHeading } from './RedactionConfirmHeading';

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
      className="flex flex-col gap-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:p-8"
    >
      <RedactionConfirmHeading maskCount={maskCount} />
      <div className="flex justify-center overflow-hidden rounded-2xl bg-[#273232] p-3 shadow-inner sm:p-6">
        <img
          src={previewUrl}
          alt="Bản đã che sẽ được tải lên"
          className="max-h-[60dvh] max-w-full rounded object-contain shadow-2xl"
        />
      </div>
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
      <div className="flex flex-col-reverse gap-2 border-t border-[#bfc9c4]/30 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-xl px-5 text-sm font-semibold text-[#404945] transition-colors hover:bg-[#e4f0f0] hover:text-[#131d1d]"
        >
          Quay lại che
        </button>
        <button
          type="button"
          disabled={decision === 'disabled'}
          onClick={submit}
          className="min-h-11 rounded-xl bg-[#004135] px-8 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-[#20594b] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Xác nhận
        </button>
      </div>
    </section>
  );
}
