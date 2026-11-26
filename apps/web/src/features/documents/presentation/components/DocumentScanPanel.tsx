import type { PrivacyEdits } from '@angia/contracts';
import { useState } from 'react';
import type { RedactionCodec } from '../../application/redactionPorts';
import { FULL_QUAD, quadIsValid } from '../../application/scanCorners';
import { nextScanStep, type ScanStep, type ScanStepAction } from '../../application/scanPanelStep';
import type { DocumentScanner } from '../../application/scanPorts';
import { useBlobUrl } from '../../application/useBlobUrl';
import { useDocumentScan } from '../../application/useDocumentScan';
import { DocumentIcon } from './DocumentIcon';
import { ScanCornerStage } from './ScanCornerStage';
import { ScanPanelActions } from './ScanPanelActions';
import './privacy-editor.css';

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

function ScanPanelHeading({ previewing }: { previewing: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/30 pb-4">
      <span className="doc-clay-tile text-accent">
        <DocumentIcon name="expand" size={22} />
      </span>
      <div className="min-w-0">
        <h3 className="auth-heading text-heading-2 font-semibold text-accent">Nắn 4 góc giấy tờ</h3>
        <p className="mt-1 text-caption text-text-secondary">
          {previewing
            ? 'Ảnh sau khi nắn. Kiểm tra chữ còn đọc rõ trước khi dùng.'
            : 'Kéo 4 chấm tới 4 góc tờ giấy.'}
        </p>
      </div>
    </div>
  );
}

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
      className="doc-bento-card flex min-w-0 flex-col gap-5 rounded-3xl p-4 sm:p-5 lg:p-6"
    >
      <ScanPanelHeading previewing={Boolean(previewUrl)} />
      <div className="flex h-[clamp(260px,48dvh,520px)] items-center justify-center rounded-2xl border border-border/30 bg-overlay p-2 shadow-inner">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Ảnh đã nắn"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
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
        <p role="alert" className="rounded-2xl bg-warning-soft px-4 py-3 text-body font-medium text-warning">
          {problem}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2.5 border-t border-border/30 pt-4">
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
