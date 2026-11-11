import type { FamilyUsage, PrivacyEdits } from '@angia/contracts';
import { useReducer, useState } from 'react';
import { useScrollIntoViewOnMount } from '../../application/useScrollIntoViewOnMount';
import { createBrowserRedactionCodec } from '@src/shared/utils/image/createBrowserRedactionCodec';
import { heicToDisplayable } from '@src/shared/utils/image/heicToDisplayable';
import { initialPrivacyEditor } from '../../application/initialPrivacyEditor';
import { privacyEditorReducer } from '../../application/privacyEditorState';
import { redactionSource } from '../../application/redactionSource';
import type { UploadItem } from '../../application/uploadQueue';
import { useRedactionSource } from '../../application/useRedactionSource';
import { useRedactionSuggestions } from '../../application/useRedactionSuggestions';
import { createDocumentScanner } from '../../infrastructure/createDocumentScanner';
import { DocumentScanPanel } from './DocumentScanPanel';
import { PrivacyEditPanel } from './PrivacyEditPanel';
import { RedactionPreviewStep } from './RedactionPreviewStep';
import { type StudioScan, type StudioSuggest, studioSlots } from './studioSlots';
import { UploadStepper } from './UploadStepper';

const codec = createBrowserRedactionCodec();
const scanner = createDocumentScanner();

type Props = {
  item: UploadItem & { previewUrl: string };
  aiExhausted: boolean;
  aiReason?: FamilyUsage['aiOcr']['reason'];
  aiBlockedReason: string | null;
  onDone: (blob: Blob, edits: PrivacyEdits, sendToAi: boolean) => void;
  onClose: () => void;
  /** SPEC-083: vắng = tính năng tắt; `run` null = chưa có hồ sơ nhận ảnh, chọn trong `choices`. */
  suggest?: StudioSuggest;
  /** SPEC-084: ảnh nắn của mục này và cách đổi/bỏ nó trong hàng đợi. */
  scan?: StudioScan;
};

// Che từng ảnh ngay trong trang Tải lên (D7): chỉnh trên ảnh gốc trong tab → xem đúng bản xuất → xác nhận.
export function UploadRedactionStudio({ item, onDone, onClose, suggest, scan, ...ai }: Props) {
  const [state, dispatch] = useReducer(privacyEditorReducer, item.edits, initialPrivacyEditor);
  const [step, setStep] = useState<'edit' | 'scan' | 'confirm'>('edit');
  const origin = redactionSource(item);
  const source = useRedactionSource(origin.file, origin.url ?? item.previewUrl, heicToDisplayable);
  const suggestions = useRedactionSuggestions({
    file: origin.file,
    edits: state.edits,
    codec,
    suggest: suggest?.run ?? null,
    dispatch,
  });
  const hasMasks = state.edits.masks.length > 0;
  // Nút "Che thông tin" nằm dưới lưới ảnh, còn khung che thay chỗ lưới: đưa khung về đầu màn hình khi mở.
  const ref = useScrollIntoViewOnMount<HTMLElement>();
  return (
    <section
      ref={ref}
      aria-label={`Che thông tin ảnh ${item.file.name}`}
      className="flex min-w-0 scroll-mt-24 flex-col gap-6"
    >
      <UploadStepper current={step === 'confirm' ? 3 : 2} />
      {source.converting ? (
        <p role="status" className="rounded-2xl bg-surface p-4 text-sm text-text-secondary shadow-sm">
          Đang mở ảnh HEIC trên máy…
        </p>
      ) : step === 'scan' && scan ? (
        <DocumentScanPanel
          src={source.src}
          file={origin.file}
          rotation={state.edits.rotation}
          hasMasks={hasMasks}
          codec={codec}
          scanner={scanner}
          onUse={scan.onScanned}
          onCancel={() => setStep('edit')}
        />
      ) : step !== 'confirm' ? (
        <PrivacyEditPanel
          state={state}
          dispatch={dispatch}
          src={source.src}
          onImageError={source.fallback}
          onNext={() => setStep('confirm')}
          onCancel={onClose}
          historyLocked={suggestions.status.kind === 'loading'}
          {...studioSlots({ suggest, suggestions, scan, hasMasks, onScan: () => setStep('scan') })}
        />
      ) : (
        <RedactionPreviewStep
          {...ai}
          file={origin.file}
          edits={state.edits}
          codec={codec}
          onBack={() => setStep('edit')}
          onConfirm={(blob, sendToAi) => onDone(blob, state.edits, sendToAi)}
        />
      )}
    </section>
  );
}
