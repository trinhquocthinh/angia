import type { FamilyUsage, PrivacyEdits } from '@angia/contracts';
import type { RedactionCodec } from '../../application/redactionPorts';
import { useRedactionExport } from '../../application/useRedactionExport';
import { RedactionConfirmStep } from './RedactionConfirmStep';

type Props = {
  file: File;
  edits: PrivacyEdits;
  codec: RedactionCodec;
  aiExhausted: boolean;
  aiReason?: FamilyUsage['aiOcr']['reason'];
  aiBlockedReason: string | null;
  onBack: () => void;
  onConfirm: (blob: Blob, sendToAi: boolean) => void;
};

const PROBLEMS = {
  too_large: 'Ảnh vẫn lớn hơn 10 MB sau khi nén. Hãy cắt nhỏ vùng nội dung.',
  decode_failed: 'Không mở được ảnh này trên trình duyệt. Hãy chụp lại hoặc chọn ảnh JPG.',
};

// Xuất JPEG đã che trên máy rồi cho xem đúng tệp đó trước khi xác nhận (KH-2 §3 bước 3).
export function RedactionPreviewStep({ file, edits, codec, onBack, onConfirm, ...ai }: Props) {
  const exported = useRedactionExport(file, edits, codec);
  if (exported.state === 'exporting')
    return (
      <p role="status" className="rounded-2xl bg-white p-4 text-sm text-[#55615f] shadow-sm">
        Đang tạo bản sẽ tải lên trên máy…
      </p>
    );
  if (exported.state === 'failed')
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-2xl bg-[#ffdad6]/60 p-4 text-sm text-[#93000a]"
      >
        {PROBLEMS[exported.problem]}
        <button type="button" onClick={onBack} className="min-h-11 self-start font-semibold underline">
          Quay lại che
        </button>
      </div>
    );
  return (
    <RedactionConfirmStep
      {...ai}
      previewUrl={exported.url}
      maskCount={edits.masks.length}
      onBack={onBack}
      onConfirm={(sendToAi) => onConfirm(exported.blob, sendToAi)}
    />
  );
}
