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
      className="doc-bento-card flex flex-col gap-5 rounded-3xl p-4 sm:p-6 lg:p-8"
    >
      <RedactionConfirmHeading maskCount={maskCount} />
      <div className="flex justify-center overflow-hidden rounded-2xl border border-border/30 bg-overlay p-3 shadow-inner sm:p-6">
        <img
          src={previewUrl}
          alt="Bản đã che sẽ được tải lên"
          className="max-h-[58dvh] max-w-full rounded-lg object-contain shadow-2xl"
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
      <div className="flex flex-col-reverse gap-2.5 border-t border-border/30 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="min-h-btn rounded-2xl border border-border/40 bg-bg px-5 text-button-secondary font-semibold text-text-secondary transition-colors hover:bg-accent-soft hover:text-text-primary"
        >
          Quay lại che
        </button>
        <button
          type="button"
          disabled={decision === 'disabled'}
          onClick={submit}
          className="min-h-14 rounded-2xl bg-accent px-8 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Xác nhận
        </button>
      </div>
    </section>
  );
}
