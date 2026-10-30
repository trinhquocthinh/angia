import type { FamilyUsage, PrivacyEdits } from '@angia/contracts';
import { useReducer, useState } from 'react';
import { createBrowserRedactionCodec } from '@src/shared/utils/image/createBrowserRedactionCodec';
import { heicToDisplayable } from '@src/shared/utils/image/heicToDisplayable';
import { initialPrivacyEditor } from '../../application/initialPrivacyEditor';
import { privacyEditorReducer } from '../../application/privacyEditorState';
import type { UploadItem } from '../../application/uploadQueue';
import { useRedactionSource } from '../../application/useRedactionSource';
import { PrivacyEditPanel } from './PrivacyEditPanel';
import { RedactionPreviewStep } from './RedactionPreviewStep';
import { UploadStepper } from './UploadStepper';

const codec = createBrowserRedactionCodec();

type Props = {
  item: UploadItem & { previewUrl: string };
  aiExhausted: boolean;
  aiReason?: FamilyUsage['aiOcr']['reason'];
  aiBlockedReason: string | null;
  onDone: (blob: Blob, edits: PrivacyEdits, sendToAi: boolean) => void;
  onClose: () => void;
};

// Che từng ảnh ngay trong trang Tải lên (D7): chỉnh trên ảnh gốc trong tab → xem đúng bản xuất → xác nhận.
export function UploadRedactionStudio({ item, onDone, onClose, ...ai }: Props) {
  const [state, dispatch] = useReducer(privacyEditorReducer, item.edits, initialPrivacyEditor);
  const [step, setStep] = useState<'edit' | 'confirm'>('edit');
  const source = useRedactionSource(item.file, item.previewUrl, heicToDisplayable);
  return (
    <section aria-label={`Che thông tin ảnh ${item.file.name}`} className="flex min-w-0 flex-col gap-6">
      <UploadStepper current={step === 'edit' ? 2 : 3} />
      {source.converting ? (
        <p role="status" className="rounded-2xl bg-white p-4 text-sm text-[#55615f] shadow-sm">
          Đang mở ảnh HEIC trên máy…
        </p>
      ) : step === 'edit' ? (
        <PrivacyEditPanel
          state={state}
          dispatch={dispatch}
          src={source.src}
          onImageError={source.fallback}
          onNext={() => setStep('confirm')}
          onCancel={onClose}
        />
      ) : (
        <RedactionPreviewStep
          {...ai}
          file={item.file}
          edits={state.edits}
          codec={codec}
          onBack={() => setStep('edit')}
          onConfirm={(blob, sendToAi) => onDone(blob, state.edits, sendToAi)}
        />
      )}
    </section>
  );
}
