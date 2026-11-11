import type { FamilyUsage, PrivacyEdits } from '@angia/contracts';
import { useEffect, useReducer, useRef, useState } from 'react';
import { createBrowserRedactionCodec } from '@src/shared/utils/image/createBrowserRedactionCodec';
import { heicToDisplayable } from '@src/shared/utils/image/heicToDisplayable';
import { initialPrivacyEditor } from '../../application/initialPrivacyEditor';
import { privacyEditorReducer } from '../../application/privacyEditorState';
import { redactionSource } from '../../application/redactionSource';
import type { UploadItem } from '../../application/uploadQueue';
import { useRedactionSource } from '../../application/useRedactionSource';
import { type SuggestFn, useRedactionSuggestions } from '../../application/useRedactionSuggestions';
import { PrivacyEditPanel } from './PrivacyEditPanel';
import { type ProfileOption, RedactionSuggestionControl } from './RedactionSuggestionControl';
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
  /** SPEC-083: vắng = tính năng tắt; `run` null = chưa có hồ sơ nhận ảnh, chọn trong `choices`. */
  suggest?: { run: SuggestFn | null; choices: ProfileOption[]; onChooseProfile: (id: string) => void };
};

// Che từng ảnh ngay trong trang Tải lên (D7): chỉnh trên ảnh gốc trong tab → xem đúng bản xuất → xác nhận.
export function UploadRedactionStudio({ item, onDone, onClose, suggest, ...ai }: Props) {
  const [state, dispatch] = useReducer(privacyEditorReducer, item.edits, initialPrivacyEditor);
  const [step, setStep] = useState<'edit' | 'confirm'>('edit');
  const origin = redactionSource(item);
  const source = useRedactionSource(origin.file, origin.url ?? item.previewUrl, heicToDisplayable);
  const suggestions = useRedactionSuggestions({
    file: origin.file,
    edits: state.edits,
    codec,
    suggest: suggest?.run ?? null,
    dispatch,
  });
  const ref = useRef<HTMLElement>(null);
  // Nút "Che thông tin" nằm dưới lưới ảnh, còn khung che thay chỗ lưới: đưa khung về đầu màn hình khi mở.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }, []);
  return (
    <section
      ref={ref}
      aria-label={`Che thông tin ảnh ${item.file.name}`}
      className="flex min-w-0 scroll-mt-24 flex-col gap-6"
    >
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
          historyLocked={suggestions.status.kind === 'loading'}
          suggestion={
            suggest && (
              <RedactionSuggestionControl
                suggestions={suggestions}
                choices={suggest.run ? null : suggest.choices}
                onChooseProfile={suggest.onChooseProfile}
              />
            )
          }
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
