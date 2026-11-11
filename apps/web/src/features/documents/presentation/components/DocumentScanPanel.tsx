import type { PrivacyEdits } from '@angia/contracts';
import { useState } from 'react';
import type { RedactionCodec } from '../../application/redactionPorts';
import { FULL_QUAD, quadIsValid } from '../../application/scanCorners';
import { nextScanStep, type ScanStep, type ScanStepAction } from '../../application/scanPanelStep';
import type { DocumentScanner } from '../../application/scanPorts';
import { useBlobUrl } from '../../application/useBlobUrl';
import { useDocumentScan } from '../../application/useDocumentScan';
import { ScanCornerStage } from './ScanCornerStage';
import { ScanPanelActions } from './ScanPanelActions';

type Props = {
  src: string;
  file: File;
  rotation: PrivacyEdits['rotation'];
  hasMasks: boolean;
  codec: RedactionCodec;
  scanner: DocumentScanner;
  onUse: (blob: Blob) => void;
  onCancel: () => void;
};

const turn = (size: { width: number; height: number }, rotation: number) =>
  rotation === 90 || rotation === 270 ? { width: size.height, height: size.width } : size;

// SPEC-084: kéo 4 góc → xem ảnh nắn → dùng ảnh nắn. Mọi xử lý trên máy, không gửi ảnh đi.
export function DocumentScanPanel({ src, file, rotation, hasMasks, codec, scanner, onUse, onCancel }: Props) {
  const [quad, setQuad] = useState(FULL_QUAD);
  const [clean, setClean] = useState(true);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [state, setState] = useState<ScanStep>({ step: 'corners' });
  const scan = useDocumentScan({ file, rotation, codec, scanner });
  const previewUrl = useBlobUrl(state.step === 'corners' ? null : state.blob);
  const valid = Boolean(size && quadIsValid(quad, turn(size, rotation)));
  const step = (action: ScanStepAction) => {
    const next = nextScanStep(state, action.type === 'use' ? { type: 'use', hasMasks } : action);
    if (next.step === 'done') onUse(next.blob);
    else setState(next);
  };
  const problem =
    scan.status === 'failed'
      ? 'Không nắn được ảnh này trên trình duyệt. Bạn vẫn che được trên ảnh gốc.'
      : !previewUrl && size && !valid
        ? '4 góc phải tạo thành tứ giác lồi.'
        : null;
  return (
    <section
      aria-label="Nắn giấy"
      className="flex min-w-0 flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm lg:p-6"
    >
      <p className="text-[13px] leading-5 text-[#404945]">
        {previewUrl
          ? 'Ảnh sau khi nắn. Kiểm tra chữ còn đọc rõ trước khi dùng.'
          : 'Kéo 4 chấm tới 4 góc tờ giấy.'}
      </p>
      <div className="flex h-[clamp(320px,52dvh,520px)] items-center justify-center rounded-xl bg-[#273232] p-2">
        {previewUrl ? (
          <img src={previewUrl} alt="Ảnh đã nắn" className="max-h-full max-w-full rounded object-contain" />
        ) : (
          <ScanCornerStage
            {...{ src, rotation, size, quad, onError: onCancel }}
            disabled={scan.status === 'working'}
            onQuad={setQuad}
            onSize={setSize}
          />
        )}
      </div>
      {problem && (
        <p role="alert" className="text-[13px] font-medium text-[#8a3a00]">
          {problem}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ScanPanelActions
          step={state.step === 'done' ? 'preview' : state.step}
          {...{ status: scan.status, valid, clean, onClean: setClean, onStep: step, onCancel }}
          onPreview={() =>
            void scan.run(quad, clean).then((blob) => blob && step({ type: 'previewed', blob }))
          }
        />
      </div>
    </section>
  );
}
