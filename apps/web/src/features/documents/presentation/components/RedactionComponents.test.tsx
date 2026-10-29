import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { UploadItem } from '../../application/uploadQueue';
import { AiBudgetSpentNotice } from './AiBudgetSpentNotice';
import { NoMaskWarning } from './NoMaskWarning';
import { RedactionConfirmStep } from './RedactionConfirmStep';
import { UploadTile } from './UploadTile';

const noop = () => undefined;
const html = (node: React.ReactElement) => renderToStaticMarkup(node);
const confirm = (props: Partial<React.ComponentProps<typeof RedactionConfirmStep>> = {}) =>
  html(
    <RedactionConfirmStep
      previewUrl="blob:da-che"
      maskCount={1}
      aiExhausted={false}
      aiBlockedReason={null}
      onBack={noop}
      onConfirm={noop}
      {...props}
    />,
  );
const item = (patch: Partial<UploadItem>): UploadItem => ({
  id: 'a',
  file: { name: 'IMG_1.HEIC', type: 'image/heic', size: 1 } as File,
  upload: null,
  edits: null,
  sendToAi: null,
  thumbnailUrl: null,
  profileId: null,
  declaredType: null,
  status: 'needs_redaction',
  attempt: 0,
  progress: 0,
  problem: null,
  error: null,
  previewUrl: 'blob:goc',
  ...patch,
});

describe('Bước xác nhận bản sẽ tải lên (E11-S3-T2)', () => {
  it('TC-430 hiện đúng ảnh đã xuất, hai lựa chọn, ô xác nhận chưa tick và nút xác nhận vô hiệu', () => {
    const text = confirm();
    expect(text).toContain('src="blob:da-che"');
    expect(text).toContain('Gửi tự động nhận diện');
    expect(text).toContain('Tôi tự nhập');
    expect(text).toContain('Tôi đã kiểm tra, ảnh này không còn thông tin định danh');
    expect(text).not.toContain('checked=""');
    expect(text).toMatch(/<button[^>]*disabled=""[^>]*>Xác nhận/);
    expect(text).toContain('Quay lại che');
  });

  it('TC-430 hết lượt tự động nhận diện → nhãn "Xếp hàng chờ tự động nhận diện" kèm giải thích', () => {
    const text = confirm({ aiExhausted: true, aiReason: 'budget_exhausted' });
    expect(text).toContain('Xếp hàng chờ tự động nhận diện');
    expect(text).not.toContain('>Gửi tự động nhận diện<');
    expect(text).toContain('Hệ thống tạm hết ngân sách');
  });

  it('TC-430 hàng chờ đã đủ → khóa lựa chọn gửi AI kèm lý do, vẫn chọn được tự nhập', () => {
    const text = confirm({ aiBlockedReason: 'Hàng chờ đã đủ 10 ảnh.' });
    expect(text).toContain('Hàng chờ đã đủ 10 ảnh.');
    // React SSR không giữ thứ tự thuộc tính của <input>: kiểm cả hai thuộc tính trong cùng thẻ.
    expect(text).toMatch(/<input(?=[^>]*value="ai")(?=[^>]*disabled="")[^>]*>/);
    expect(text).not.toMatch(/<input(?=[^>]*value="manual")(?=[^>]*disabled="")[^>]*>/);
  });

  it('TC-431 hỏi lại khi không có vùng che dùng đúng chuỗi cố định', () => {
    const text = html(<NoMaskWarning busy={false} onBack={noop} onSendAnyway={noop} />);
    expect(text).toContain('Quay lại che');
    expect(text).toContain('Ảnh không có thông tin cá nhân — vẫn tải lên');
  });

  it('TC-615 thông báo riêng cho từng lý do hết lượt, không có số tiền', () => {
    expect(html(<AiBudgetSpentNotice />)).toContain(
      'Gia đình chưa có lượt nhận diện khả dụng trong tháng này.',
    );
    expect(html(<AiBudgetSpentNotice reason="billing_unavailable" />)).toContain('đang xác nhận dữ liệu phí');
    expect(html(<AiBudgetSpentNotice reason="billing_unavailable" />)).not.toMatch(/\$|USD/);
  });
});

describe('Ô ảnh trong hàng chờ tải lên (E11-S3-T2)', () => {
  it('ảnh chưa che có nút "Che thông tin"; ảnh đã che hiện bản đã xuất và nút "Chỉnh lại"', () => {
    const raw = html(<UploadTile item={item({})} locked={false} onRemove={noop} onRedact={noop} />);
    expect(raw).toContain('Che thông tin');
    expect(raw).not.toContain('Chỉnh lại');
    const ready = html(
      <UploadTile
        item={item({ status: 'ready', thumbnailUrl: 'blob:da-che' })}
        locked={false}
        onRemove={noop}
        onRedact={noop}
      />,
    );
    expect(ready).toContain('src="blob:da-che"');
    expect(ready).not.toContain('src="blob:goc"');
    expect(ready).toContain('Chỉnh lại');
    const sending = html(
      <UploadTile
        item={item({ status: 'ready', thumbnailUrl: 'blob:da-che' })}
        locked
        onRemove={noop}
        onRedact={noop}
      />,
    );
    expect(sending).not.toContain('Chỉnh lại');
  });
});
