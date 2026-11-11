export type ScanStep = { step: 'corners' } | { step: 'preview' | 'confirm' | 'done'; blob: Blob };

export type ScanStepAction =
  | { type: 'previewed'; blob: Blob }
  | { type: 'adjust' | 'keep' | 'confirmed' }
  | { type: 'use'; hasMasks: boolean };

/** SPEC-084 §3: kéo góc → xem trước → (hỏi lại nếu đang có vùng che) → dùng ảnh nắn. */
export function nextScanStep(state: ScanStep, action: ScanStepAction): ScanStep {
  if (action.type === 'previewed') return { step: 'preview', blob: action.blob };
  if (action.type === 'adjust' || state.step === 'corners') return { step: 'corners' };
  if (action.type === 'use') return { step: action.hasMasks ? 'confirm' : 'done', blob: state.blob };
  if (action.type === 'keep') return { step: 'preview', blob: state.blob };
  return state.step === 'confirm' ? { step: 'done', blob: state.blob } : state;
}
