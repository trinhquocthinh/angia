import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialPrivacyEditor } from '../../application/initialPrivacyEditor';
import { privacyEditorReducer } from '../../application/privacyEditorState';
import { AiBudgetSpentNotice } from './AiBudgetSpentNotice';
import { PrivacyApprovalControls } from './PrivacyApprovalControls';

const noop = () => undefined;
const ready = { state: 'ready' as const, draftId: 'd', sha256: 'a'.repeat(64), imageUrl: '/i.png' };

describe('TC-309 — hết lượt đọc tự động tháng này ở bước gửi AI (SPEC-031)', () => {
  it('thông báo kèm hai lựa chọn: nhập tay ngay hoặc xếp hàng chờ', () => {
    const html = renderToStaticMarkup(<AiBudgetSpentNotice busy={false} onManual={noop} onQueue={noop} />);
    expect(html).toContain('Đã dùng 100% lượt đọc tự động tháng này.');
    expect(html).toContain('Nhập tay ngay');
    expect(html).toContain('Xếp hàng chờ');
  });

  it('hết trần thì không còn nút "Xác nhận và OCR"; còn trần thì giữ nút cũ', () => {
    const state = privacyEditorReducer(initialPrivacyEditor(), { type: 'remote', draft: ready, revision: 0 });
    const props = { state, loaded: true, busy: false, dispatch: noop, onApprove: noop, onManual: noop };
    expect(renderToStaticMarkup(<PrivacyApprovalControls {...props} aiExhausted />)).not.toContain(
      'Xác nhận và OCR',
    );
    expect(renderToStaticMarkup(<PrivacyApprovalControls {...props} aiExhausted={false} />)).toContain(
      'Xác nhận và OCR',
    );
  });
});
