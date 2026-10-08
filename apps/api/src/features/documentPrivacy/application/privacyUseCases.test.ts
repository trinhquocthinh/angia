import { describe, expect, it } from 'vitest';
import { createPrivacyDraft } from './createPrivacyDraft.js';
import { approvePrivacy } from './approvePrivacy.js';
import { selectManualEntry } from './selectManualEntry.js';
import { getPrivacyDraft } from './getPrivacyDraft.js';
import { openPrivacyImage } from './openPrivacyImage.js';
import { privacyFixture } from '@src/shared/test/privacyFixture.js';
const edits = {
  rotation: 0,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [],
} as const;
describe('Bản nháp và xác nhận ảnh', () => {
  it('TC-167: tạo pending và chỉ enqueue bản mới', async () => {
    const f = privacyFixture();
    const result = await createPrivacyDraft(f.deps, { ...f.target, edits: { ...edits, masks: [] } });
    expect(result).toEqual({ ok: true, value: { state: 'pending', draftId: f.draftId } });
    expect(f.jobs).toEqual(['prepare']);
    expect(f.doc.ocrImageKey).toBeNull();
  });
  it('TC-167b: pending hoặc consent bị thu hồi không tạo thêm job', async () => {
    const f = privacyFixture();
    f.doc.privacyDraftStatus = 'pending';
    expect(await createPrivacyDraft(f.deps, { ...f.target, edits: { ...edits, masks: [] } })).toMatchObject({
      ok: false,
    });
    f.doc.privacyDraftStatus = null;
    f.consent = false;
    expect(await createPrivacyDraft(f.deps, { ...f.target, edits: { ...edits, masks: [] } })).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(f.jobs).toEqual([]);
  });
  it('TC-168: xác nhận PNG đúng hash lấy actor từ input phiên và enqueue một lần', async () => {
    const f = privacyFixture();
    f.ready();
    expect(await approvePrivacy(f.deps, f.approval)).toMatchObject({
      ok: true,
      value: { status: 'extracting', privacyApprovedBy: 'actor' },
    });
    expect(await approvePrivacy(f.deps, f.approval)).toMatchObject({ ok: true });
    expect(f.jobs).toEqual(['extract']);
  });
  it('TC-169: byte/hash bị đổi hoặc key khác prefix không được gửi OCR', async () => {
    for (const change of ['bytes', 'prefix', 'hash']) {
      const f = privacyFixture();
      f.ready();
      if (change === 'bytes') f.bytes = new Uint8Array([1, 2, 3]);
      if (change === 'prefix') f.doc.ocrImageKey = 'families/other/ocr.png';
      if (change === 'hash') f.approval.sha256 = '0'.repeat(64);
      expect(await approvePrivacy(f.deps, f.approval)).toMatchObject({ ok: false });
      expect(f.jobs).toEqual([]);
    }
  });
  it('TC-170: đọc S3 ngoài transaction, khóa lại và kiểm consent/phiên bản', async () => {
    for (const change of ['consent', 'version']) {
      const f = privacyFixture();
      f.ready();
      f.onRead = () => {
        if (change === 'consent') f.consent = false;
        else f.doc.privacyDraftId = 'new';
      };
      expect(await approvePrivacy(f.deps, f.approval)).toMatchObject({ ok: false });
      expect(f.jobs).toEqual([]);
    }
  });
  it('TC-171: nhập tay từ uploaded/awaiting_privacy, OCR không chạy', async () => {
    const f = privacyFixture();
    expect(await selectManualEntry(f.deps.repository, f.target)).toMatchObject({
      ok: true,
      value: { status: 'manual_entry' },
    });
    expect(await selectManualEntry(f.deps.repository, f.target)).toMatchObject({ ok: false });
    expect(f.jobs).toEqual([]);
  });
  it('TC-172: pending mất job hoặc terminal phục hồi failed nhưng job active giữ pending', async () => {
    for (const state of [null, 'failed', 'cancelled', 'completed', 'active', 'created', 'retry']) {
      const f = privacyFixture();
      f.doc.privacyDraftStatus = 'pending';
      f.doc.privacyDraftId = f.draftId;
      f.jobState = state;
      const terminal = [null, 'failed', 'cancelled', 'completed'].includes(state);
      expect(await getPrivacyDraft(f.deps.repository, f.deps.queue, f.target)).toEqual({
        ok: true,
        value: { state: terminal ? 'failed' : 'pending', draftId: f.draftId },
      });
    }
  });
  it('TC-173: ảnh chỉ đọc đúng bản ready hiện hành, không dùng gốc/preview', async () => {
    const f = privacyFixture();
    f.ready();
    expect(
      await openPrivacyImage(f.deps.repository, f.deps.reader, { ...f.target, draftId: f.draftId }),
    ).toMatchObject({ ok: true, value: { contentType: 'image/png' } });
    expect(
      await openPrivacyImage(f.deps.repository, f.deps.reader, { ...f.target, draftId: 'old' }),
    ).toMatchObject({ ok: false, code: 'ERR_NOT_FOUND' });
  });
  it('TC-174: khác gia đình và không có chứng từ đều trả not found', async () => {
    const f = privacyFixture();
    f.missing = true;
    expect(await createPrivacyDraft(f.deps, { ...f.target, edits: { ...edits, masks: [] } })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await approvePrivacy(f.deps, f.approval)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(await selectManualEntry(f.deps.repository, f.target)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
});
