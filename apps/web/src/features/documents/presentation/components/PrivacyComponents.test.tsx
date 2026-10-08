import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialPrivacyEditor } from '../../application/initialPrivacyEditor';
import { privacyEditorReducer } from '../../application/privacyEditorState';
import { PrivacyDraftReview } from './PrivacyDraftReview';
import { PrivacyCanvas } from './PrivacyCanvas';
import { PrivacyRectangleFields } from './PrivacyRectangleFields';
const ready = { state: 'ready' as const, draftId: 'd', sha256: 'a'.repeat(64), imageUrl: '/api/image.png' };
const noop = () => undefined;
const state = () =>
  privacyEditorReducer(initialPrivacyEditor(), { type: 'remote', draft: ready, revision: 0 });
describe('Giao diện kiểm tra riêng tư', () => {
  it('TC-216: bản server chưa tải không bật xác nhận và không chọn sẵn checkbox', () => {
    const text = renderToStaticMarkup(
      <PrivacyDraftReview state={state()} busy={false} dispatch={noop} onApprove={noop} />,
    );
    expect(text).toContain('src="/api/image.png"');
    expect(text).toMatch(/<button[^>]*disabled=""[^>]*>Xác nhận và OCR/);
    expect(text).not.toContain('checked=""');
  });
  it('TC-217: bản đã sửa không hiện ảnh cũ như ảnh có thể xác nhận', () => {
    const edited = privacyEditorReducer(state(), { type: 'rotate' });
    const text = renderToStaticMarkup(
      <PrivacyDraftReview state={edited} busy={false} dispatch={noop} onApprove={noop} />,
    );
    expect(text).not.toContain('src="/api/image.png"');
    expect(text).toContain('Tạo bản kiểm tra mới');
  });
  it('TC-218: sửa bằng bàn phím có nhãn và giới hạn số vùng trong ảnh', () => {
    const text = renderToStaticMarkup(
      <PrivacyRectangleFields
        label="Vùng cắt"
        rectangle={{ left: 0, top: 0, width: 1000000, height: 1000000 }}
        disabled={false}
        onChange={noop}
      />,
    );
    expect(text.match(/type="number"/g)).toHaveLength(4);
    expect(text).toContain('Vùng cắt — Trái');
    expect(text).toContain('max="100"');
  });
  it('TC-219: khung thao tác có nền preview và overlay hình chữ nhật', () => {
    const text = renderToStaticMarkup(
      <PrivacyCanvas
        documentId="doc"
        edits={{ rotation: 90, crop: { left: 100000, top: 0, width: 800000, height: 1000000 }, masks: [] }}
        mode="mask"
        disabled={false}
        onBegin={noop}
        onRectangle={noop}
        onPreview={noop}
      />,
    );
    expect(text).toContain('src="/api/source-documents/doc/image?variant=preview"');
    expect(text).toContain('aria-label="Vùng chỉnh ảnh"');
    expect(text).toContain('viewBox="0 0 1000000 1000000"');
  });
});
