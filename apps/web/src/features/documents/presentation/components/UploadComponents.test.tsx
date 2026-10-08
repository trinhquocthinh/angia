import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { UploadItem } from '../../application/uploadQueue';
import { RejectedFiles } from './RejectedFiles';
import { UploadDropZone } from './UploadDropZone';
import { UploadGrid } from './UploadGrid';
import { UploadIntro } from './UploadIntro';

vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: unknown }) => children }));
const { ProfilePicker } = await import('./ProfilePicker');
const { UploadActions } = await import('./UploadActions');

const profile = (id: string, consentStatus: HealthProfile['consentStatus']): HealthProfile => ({
  id,
  familyId: 'f',
  displayName: id === 'me' ? 'Mẹ' : 'Ba',
  birthYear: null,
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
    expect(text).not.toMatch(/256-bit|đầu cuối|AI nội bộ|#AG-/);
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
    expect(text).toMatch(/disabled=""[^>]*>.*Ba.*chưa đồng thuận/);
    expect(text).toContain('gửi link mời');
  });
  it('vùng thả ảnh chỉ khóa khi đang gửi; ảnh gốc tới 30 MB được nén trước khi gửi (E3-S1-T2)', () => {
    expect(html(<UploadDropZone disabled onFiles={() => undefined} />)).toContain('Đang gửi ảnh');
    const open = html(<UploadDropZone disabled={false} onFiles={() => undefined} />);
    expect(open).toContain('Tối đa 30 MB mỗi ảnh, ảnh lớn được nén trên máy trước khi gửi');
    expect(open).toContain('multiple=""');
  });
  it('lưới ảnh hiển thị tiến trình, lỗi và nút thử lại; tệp bị loại nêu lý do', () => {
    const items = [
      item('a.jpg', { status: 'uploading', progress: 64 }),
      item('b.jpg', { status: 'failed', error: 'Mất kết nối. Kiểm tra mạng rồi thử lại.' }),
      item('IMG_4410.jpg', { status: 'rejected', problem: 'too_large' }),
      item('hen.pdf', { status: 'rejected', problem: 'unsupported' }),
      item('IMG_9.heic', { status: 'rejected', problem: 'not_compressible' }),
    ];
    const grid = html(
      <UploadGrid
        items={items}
        summary={{ preparing: 0, ready: 0, total: 2, done: 0, active: 1, failed: 1 }}
        locked
        onRetry={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(grid).toContain('64%');
    const waiting = html(
      <UploadGrid
        items={[item('c.jpg', { status: 'uploading', notice: 'Máy chủ bận · tự thử lại sau 9 giây' })]}
        summary={{ preparing: 0, ready: 0, total: 1, done: 0, active: 1, failed: 0 }}
        locked
        onRetry={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(waiting).toContain('Máy chủ bận · tự thử lại sau 9 giây');
    expect(waiting).not.toContain('0%');
    expect(grid).toContain('Gửi lại 1 ảnh lỗi');
    expect(grid).not.toContain('IMG_4410.jpg');
    const rejected = html(<RejectedFiles items={items} validCount={2} onDismiss={() => undefined} />);
    expect(rejected).toContain('3 tệp không nhận được · 2 ảnh còn lại vẫn được tải bình thường');
    expect(rejected).toContain('Dung lượng vượt quá 30 MB (24.2 MB)');
    expect(rejected).toContain('Trình duyệt không nén được ảnh này, vượt quá 10 MB (24.2 MB)');
    expect(rejected).toContain('Chỉ nhận ảnh JPG, PNG, HEIC, WebP');
  });
  it('2X: chưa bấm Xong thì không gửi; nút Xong cần ảnh chưa gửi và hồ sơ đã chọn', () => {
    const idle = { preparing: 0, ready: 0, total: 0, done: 0, active: 0 };
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
  it('E3-S1-T2: đang nén ảnh thì khóa nút Xong; ô ảnh hiện "Đang nén"', () => {
    const summary = { preparing: 1, ready: 2, total: 3, done: 0, active: 0, failed: 0 };
    const actions = html(<UploadActions summary={summary} profileChosen onSubmit={() => undefined} />);
    expect(actions).toMatch(/<button[^>]*disabled=""[^>]*>Xong — gửi 2 ảnh/);
    expect(actions).toContain('Đang nén ảnh trên máy, chờ ít giây rồi bấm Xong.');
    expect(actions).toContain('Ảnh lớn được nén trên máy rồi gửi cùng một lô');
    const grid = html(
      <UploadGrid
        items={[item('IMG_2.jpg', { status: 'preparing' })]}
        summary={summary}
        locked={false}
        onRetry={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(grid).toContain('Đang nén');
    expect(grid).toContain('1 đang nén');
    expect(grid).toContain('aria-label="Bỏ ảnh IMG_2.jpg"');
  });
  it('ảnh chưa gửi có nút bỏ (ẩn khi đang gửi); HEIC vẫn thử ảnh xem trước', () => {
    const items = [
      item('IMG_1917.HEIC', {
        status: 'ready',
        previewUrl: 'blob:heic',
        file: { name: 'IMG_1917.HEIC', type: '', size: 1 } as File,
      }),
    ];
    const props = {
      items,
      summary: { preparing: 0, ready: 1, total: 1, done: 0, active: 0, failed: 0 },
      onRetry: () => undefined,
      onRemove: () => undefined,
    };
    const open = html(<UploadGrid {...props} locked={false} />);
    expect(open).toContain('aria-label="Bỏ ảnh IMG_1917.HEIC"');
    expect(open).toContain('src="blob:heic"');
    expect(open).toContain('1 chưa gửi');
    expect(html(<UploadGrid {...props} locked />)).not.toContain('Bỏ ảnh IMG_1917.HEIC');
  });
});
