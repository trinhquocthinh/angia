import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { UploadItem } from '../../application/uploadQueue';
import { RejectedFiles } from './RejectedFiles';
import { UploadAddTile } from './UploadAddTile';
import { UploadDropZone } from './UploadDropZone';
import { UploadGrid } from './UploadGrid';
import { UploadIntro } from './UploadIntro';
import { UploadPhotoTips } from './UploadPhotoTips';
import { UploadStepper } from './UploadStepper';

vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: unknown }) => children }));
const { ProfilePicker } = await import('./ProfilePicker');
const { UploadActions } = await import('./UploadActions');

const profile = (id: string, consentStatus: HealthProfile['consentStatus']): HealthProfile => ({
  id,
  familyId: 'f',
  displayName: id === 'me' ? 'Mẹ' : 'Ba',
  birthYear: null,
  vitalsEnabled: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus,
  consentSource: consentStatus === 'confirmed' ? 'invitation' : null,
  consentRespondentName: null,
  createdAt: '2026-10-06T00:00:00Z',
});
const item = (name: string, patch: Partial<UploadItem> = {}): UploadItem => ({
  id: name,
  file: { name, type: 'image/heic', size: 24.2 * 1024 * 1024 } as File,
  upload: null,
  edits: null,
  sendToAi: null,
  thumbnailUrl: null,
  profileId: 'me',
  declaredType: null,
  status: 'queued',
  attempt: 0,
  progress: 0,
  problem: null,
  error: null,
  previewUrl: null,
  ...patch,
});
const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe('Giao diện /upload theo Stitch a48f7111', () => {
  it('nhắc quyền riêng tư theo Design §6, không có tuyên bố mã hóa đầu cuối/AI nội bộ', () => {
    const text = html(<UploadIntro />);
    expect(text).toContain('Chỉ chụp thuốc, chỉ số, ngày. Không chụp họ tên');
    expect(text).not.toMatch(/256-bit|đầu cuối|AI nội bộ|#AG-|HL7/);
  });
  it('TC-011 (UI): hồ sơ chưa đồng thuận bị khóa và có hướng dẫn gửi link mời', () => {
    const text = html(
      <ProfilePicker
        profiles={[profile('me', 'confirmed'), profile('ba', 'invited')]}
        selectedId="me"
        locked={false}
        onSelect={() => undefined}
      />,
    );
    expect(text).toMatch(/aria-pressed="true"[^>]*>.*Mẹ/);
    expect(text).toMatch(/disabled=""[^>]*>.*Ba.*chưa xác nhận/);
    expect(text).toContain('gửi link mời');
  });
  it('vùng thả ảnh chỉ khóa khi đang gửi; ảnh gốc tới 30 MB được che và nén trên máy trước khi gửi', () => {
    expect(html(<UploadDropZone disabled onFiles={() => undefined} />)).toContain('Đang gửi ảnh');
    const open = html(<UploadDropZone disabled={false} onFiles={() => undefined} />);
    expect(open).toContain('Tối đa 30 MB mỗi ảnh, ảnh được che và nén trên máy trước khi gửi');
    expect(open).toContain('multiple=""');
  });
  it('lưới ảnh hiển thị tiến trình, lỗi và nút thử lại; tệp bị loại nêu lý do', () => {
    const items = [
      item('a.jpg', { status: 'uploading', progress: 64 }),
      item('b.jpg', { status: 'failed', error: 'Mất kết nối. Kiểm tra mạng rồi thử lại.' }),
      item('IMG_4410.jpg', { status: 'rejected', problem: 'too_large' }),
      item('hen.pdf', { status: 'rejected', problem: 'unsupported' }),
    ];
    const grid = html(
      <UploadGrid
        items={items}
        summary={{ needsRedaction: 0, ready: 0, total: 2, done: 0, active: 1, failed: 1 }}
        locked
        onRetry={() => undefined}
        onRemove={() => undefined}
        onRedact={() => undefined}
      />,
    );
    expect(grid).toContain('64%');
    const waiting = html(
      <UploadGrid
        items={[item('c.jpg', { status: 'uploading', notice: 'Máy chủ bận · tự thử lại sau 9 giây' })]}
        summary={{ needsRedaction: 0, ready: 0, total: 1, done: 0, active: 1, failed: 0 }}
        locked
        onRetry={() => undefined}
        onRemove={() => undefined}
        onRedact={() => undefined}
      />,
    );
    expect(waiting).toContain('Máy chủ bận · tự thử lại sau 9 giây');
    expect(waiting).not.toContain('0%');
    expect(grid).toContain('Gửi lại 1 ảnh lỗi');
    expect(grid).not.toContain('IMG_4410.jpg');
    const rejected = html(<RejectedFiles items={items} validCount={2} onDismiss={() => undefined} />);
    expect(rejected).toContain('2 tệp không nhận được · 2 ảnh còn lại vẫn được tải bình thường');
    expect(rejected).toContain('Dung lượng vượt quá 30 MB (24.2 MB)');
    expect(rejected).toContain('Chỉ nhận ảnh JPG, PNG, HEIC, WebP');
  });
  it('2X: chưa bấm Xong thì không gửi; nút Xong cần ảnh chưa gửi và hồ sơ đã chọn', () => {
    const idle = { needsRedaction: 0, ready: 0, total: 0, done: 0, active: 0 };
    const button = (summary: typeof idle, profileChosen: boolean) =>
      html(<UploadActions summary={summary} profileChosen={profileChosen} onSubmit={() => undefined} />);
    expect(button(idle, true)).toMatch(/<button[^>]*disabled=""[^>]*>Xong — gửi ảnh/);
    expect(button({ ...idle, ready: 3, total: 3 }, false)).toContain(
      'Chọn hồ sơ ở mục “Của ai?” trước khi gửi.',
    );
    expect(button({ ...idle, ready: 3, total: 3 }, false)).toMatch(/<button[^>]*disabled=""/);
    expect(button({ ...idle, ready: 3, total: 3 }, true)).toMatch(
      /<button type="button" class="[^"]*">Xong — gửi 3 ảnh, đến Chờ duyệt/,
    );
    expect(button({ ...idle, total: 3, done: 1, active: 2 }, true)).toMatch(/disabled=""[^>]*>Đang gửi 1\/3/);
  });
  it('TC-429: còn ảnh chưa che thì khóa nút Xong; ô ảnh có nút "Che thông tin"', () => {
    const summary = { needsRedaction: 1, ready: 2, total: 3, done: 0, active: 0, failed: 0 };
    const actions = html(<UploadActions summary={summary} profileChosen onSubmit={() => undefined} />);
    expect(actions).toMatch(/<button[^>]*disabled=""[^>]*>Xong — gửi 2 ảnh/);
    expect(actions).toContain('Còn 1 ảnh chưa che. Che xong mọi ảnh rồi bấm Xong.');
    expect(actions).toContain('Ảnh được che và nén trên máy rồi gửi cùng một lô');
    const grid = html(
      <UploadGrid
        items={[item('IMG_2.jpg', { status: 'needs_redaction' })]}
        summary={summary}
        locked={false}
        onRetry={() => undefined}
        onRemove={() => undefined}
        onRedact={() => undefined}
      />,
    );
    expect(grid).toContain('Che thông tin');
    expect(grid).toContain('1 chưa che');
    expect(grid).toContain('aria-label="Bỏ ảnh IMG_2.jpg"');
  });
  it('ảnh chưa gửi có nút bỏ (ẩn khi đang gửi); ô ảnh đã che hiện bản đã xuất', () => {
    const items = [
      item('IMG_1917.HEIC', {
        status: 'ready',
        previewUrl: 'blob:heic',
        thumbnailUrl: 'blob:da-che',
        file: { name: 'IMG_1917.HEIC', type: '', size: 1 } as File,
      }),
    ];
    const props = {
      items,
      summary: { needsRedaction: 0, ready: 1, total: 1, done: 0, active: 0, failed: 0 },
      onRetry: () => undefined,
      onRemove: () => undefined,
      onRedact: () => undefined,
    };
    const open = html(<UploadGrid {...props} locked={false} />);
    expect(open).toContain('aria-label="Bỏ ảnh IMG_1917.HEIC"');
    expect(open).toContain('src="blob:da-che"');
    expect(open).toContain('1 chưa gửi');
    expect(html(<UploadGrid {...props} locked />)).not.toContain('Bỏ ảnh IMG_1917.HEIC');
  });
  it('thanh bước chỉ là chỉ báo: đánh dấu đúng bước hiện tại, không có nút bấm', () => {
    const text = html(<UploadStepper current={2} />);
    expect(text).toMatch(/aria-current="step"[^>]*>.*Cắt &amp; Che định danh/);
    expect(text.match(/aria-current/g)).toHaveLength(1);
    expect(text).not.toContain('<button');
  });
  it('ô ảnh nêu trạng thái bằng chữ; ô "Thêm ảnh khác" chỉ hiện khi được truyền vào', () => {
    const props = {
      summary: { needsRedaction: 1, ready: 0, total: 1, done: 0, active: 0, failed: 0 },
      locked: false,
      onRetry: () => undefined,
      onRemove: () => undefined,
      onRedact: () => undefined,
    };
    const items = [item('a.jpg', { status: 'needs_redaction' })];
    expect(html(<UploadGrid {...props} items={items} />)).toContain('Chưa che');
    expect(html(<UploadGrid {...props} items={items} />)).not.toContain('Thêm ảnh khác');
    const more = html(
      <UploadGrid {...props} items={items} addMore={<UploadAddTile onFiles={() => undefined} />} />,
    );
    expect(more).toContain('Thêm ảnh khác');
    expect(more).toContain('multiple=""');
  });
  it('tinh chỉnh nội dung: bỏ chữ thừa, tách định dạng thành nhãn, có gợi ý chụp ảnh không phải lời khuyên y tế', () => {
    expect(html(<UploadIntro />)).not.toContain('Cập nhật mới');
    expect(html(<UploadStepper current={1} />)).not.toContain('Hạn mức');
    const open = html(<UploadDropZone disabled={false} onFiles={() => undefined} />);
    expect(open).toContain('Kéo ảnh vào đây hoặc');
    for (const format of ['JPG', 'PNG', 'HEIC', 'WebP']) expect(open).toContain(`>${format}<`);
    expect(open).toContain('Tối đa 10 ảnh mỗi lần chọn');
    const blocked = html(<UploadDropZone disabled blockedReason="Đã đủ ảnh hôm nay." onFiles={() => {}} />);
    expect(blocked).toContain('Đã đủ ảnh hôm nay.');
    expect(blocked).not.toContain('>HEIC<');
    const tips = html(<UploadPhotoTips />);
    expect(tips).toContain('Để ảnh dễ đọc');
    expect(tips).not.toMatch(/tốt|xấu|bất thường|nên uống/);
  });
  it('thanh tiến trình chạy bằng transform để mượt, % vẫn hiển thị bằng chữ', () => {
    const grid = html(
      <UploadGrid
        items={[item('a.jpg', { status: 'uploading', progress: 64 })]}
        summary={{ needsRedaction: 0, ready: 0, total: 1, done: 0, active: 1, failed: 0 }}
        locked
        onRetry={() => undefined}
        onRemove={() => undefined}
        onRedact={() => undefined}
      />,
    );
    expect(grid).toContain('scaleX(0.64)');
    expect(grid).toContain('64%');
  });
});
