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
  it('vùng thả ảnh khóa tới khi chọn hồ sơ; giới hạn hiển thị 10 MB', () => {
    expect(html(<UploadDropZone disabled onFiles={() => undefined} />)).toContain('Chọn hồ sơ đã đồng thuận');
    const open = html(<UploadDropZone disabled={false} onFiles={() => undefined} />);
    expect(open).toContain('Tối đa 10 MB mỗi ảnh');
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
        summary={{ total: 2, done: 0, active: 1, failed: 1 }}
        onRetry={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(grid).toContain('64%');
    expect(grid).toContain('Thử lại 1 ảnh lỗi');
    expect(grid).not.toContain('IMG_4410.jpg');
    const rejected = html(<RejectedFiles items={items} validCount={2} onDismiss={() => undefined} />);
    expect(rejected).toContain('2 tệp không nhận được · 2 ảnh còn lại vẫn được tải bình thường');
    expect(rejected).toContain('Dung lượng vượt quá 10 MB (24.2 MB)');
    expect(rejected).toContain('Chỉ nhận ảnh JPG, PNG, HEIC, WebP');
  });
});
