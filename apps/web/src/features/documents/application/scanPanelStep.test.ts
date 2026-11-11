import { describe, expect, it } from 'vitest';
import { nextScanStep } from './scanPanelStep';

const blob = new Blob(['scan']);

describe('Các bước nắn giấy (SPEC-084)', () => {
  it('TC-916: đang có vùng che thì "Dùng ảnh này" hỏi lại; Huỷ ở hộp hỏi quay về xem trước, không áp dụng', () => {
    const preview = nextScanStep({ step: 'corners' }, { type: 'previewed', blob });
    expect(preview).toEqual({ step: 'preview', blob });
    const confirm = nextScanStep(preview, { type: 'use', hasMasks: true });
    expect(confirm).toEqual({ step: 'confirm', blob });
    expect(nextScanStep(confirm, { type: 'keep' })).toEqual({ step: 'preview', blob });
    expect(nextScanStep(confirm, { type: 'confirmed' })).toEqual({ step: 'done', blob });
  });

  it('chưa có vùng che thì dùng ngay; "Chỉnh lại góc" quay về kéo góc', () => {
    const preview = nextScanStep({ step: 'corners' }, { type: 'previewed', blob });
    expect(nextScanStep(preview, { type: 'use', hasMasks: false })).toEqual({ step: 'done', blob });
    expect(nextScanStep(preview, { type: 'adjust' })).toEqual({ step: 'corners' });
    expect(nextScanStep({ step: 'corners' }, { type: 'use', hasMasks: false })).toEqual({ step: 'corners' });
  });
});
