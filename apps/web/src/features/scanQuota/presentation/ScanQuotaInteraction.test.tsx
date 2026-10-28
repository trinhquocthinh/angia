import type * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { familyId, view } from '../test/scanQuotaFixtures';
import { createQuotaRenderer } from '../test/createQuotaRenderer';
import { ScanQuotaEditor } from './ScanQuotaEditor';
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useState: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
function harness() {
  const renderer = createQuotaRenderer();
  const onGrant = vi.fn(async () => undefined);
  let initial = view;
  let account = 'a';
  let pending = false;
  let error: Error | null = null;
  const render = () =>
    renderer.render(
      <ScanQuotaEditor
        key={account}
        initial={initial}
        pending={pending}
        error={error}
        saved={false}
        onGrant={onGrant}
      />,
    );
  render();
  return {
    renderer,
    onGrant,
    render,
    setView: (next: typeof view) => {
      initial = next;
    },
    setAccount: (next: string) => {
      account = next;
    },
    setPending: () => {
      pending = true;
    },
    setError: (next: Error) => {
      error = next;
    },
  };
}
describe('Tương tác cấp lượt', () => {
  it('TC-592: không tự duyệt khi tải, chỉ gửi dòng được chọn với tổng đã sửa', () => {
    const h = harness();
    expect(h.onGrant).not.toHaveBeenCalled();
    h.renderer.submit(0);
    h.render();
    expect(h.onGrant).not.toHaveBeenCalled();
    h.renderer.select(0, true);
    h.render();
    h.renderer.change(`scan-grant-${familyId}`, '15');
    h.render();
    h.renderer.change(`scan-grant-${familyId}-reason`, 'Gia hạn tháng');
    h.render();
    h.renderer.submit(0);
    expect(h.onGrant).toHaveBeenCalledWith({
      month: '2026-10',
      expectedVersion: 7,
      grants: [{ familyId, status: 'approved', grantedScans: 15, reason: 'Gia hạn tháng' }],
    });
  });
  it('TC-591: xung đột và cập nhật nền giữ bản sửa, tháng và version ban đầu', () => {
    const h = harness();
    h.renderer.select(0, true);
    h.render();
    h.renderer.change(`scan-grant-${familyId}-reason`, 'Duyệt');
    h.render();
    h.setView({ ...view, month: '2026-11', version: 88 });
    h.setError(new AdminRequestError('ERR_SCAN_QUOTA_CONFLICT', 409));
    h.render();
    expect(h.renderer.text).toContain('Bản đang sửa vẫn được giữ');
    expect(h.renderer.text).toContain('Bản sửa tháng 2026-10');
    h.renderer.submit(0);
    expect(h.onGrant).toHaveBeenCalledWith(expect.objectContaining({ month: '2026-10', expectedVersion: 7 }));
  });
  it('TC-591: đổi tài khoản đặt lại bản sửa và bỏ lựa chọn cũ', () => {
    const h = harness();
    h.renderer.select(0, true);
    h.render();
    h.renderer.change(`scan-grant-${familyId}`, '99');
    h.render();
    h.setAccount('b');
    h.setView({ ...view, month: '2026-11', version: 9 });
    h.render();
    expect(h.renderer.nodes.find((node) => node.props.id === `scan-grant-${familyId}`)?.props.value).toBe(
      '12',
    );
    expect(h.renderer.nodes.find((node) => node.props.type === 'checkbox')?.props.checked).toBe(false);
    expect(h.renderer.text).toContain('Bản sửa tháng 2026-11');
    expect(h.onGrant).not.toHaveBeenCalled();
  });
  it('TC-592: mọi form dùng chung pending, không gửi thêm thao tác', () => {
    const h = harness();
    h.setPending();
    h.render();
    h.renderer.submit(0);
    expect(
      h.renderer.nodes
        .filter((node) => node.type === 'fieldset')
        .slice(0, 1)
        .every((node) => node.props.disabled),
    ).toBe(true);
    expect(h.onGrant).not.toHaveBeenCalled();
  });
});
