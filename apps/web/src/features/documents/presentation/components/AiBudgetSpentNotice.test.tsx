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
    expect(html).toContain('Gia đình chưa có lượt nhận diện khả dụng trong tháng này.');
    expect(html).not.toContain('đầu tháng sau');
    expect(html).toContain('Nhập tay ngay');
    expect(html).toContain('Xếp hàng chờ');
  });

  it('TC-615: ngân sách và dữ liệu phí có thông báo riêng', () => {
    const render = (reason: 'budget_exhausted' | 'billing_unavailable') =>
      renderToStaticMarkup(
        <AiBudgetSpentNotice reason={reason} busy={false} onManual={noop} onQueue={noop} />,
      );
    expect(render('budget_exhausted')).toContain('Hệ thống tạm hết ngân sách');
    expect(render('billing_unavailable')).toContain('đang xác nhận dữ liệu phí');
    expect(render('billing_unavailable')).not.toContain('100%');
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
