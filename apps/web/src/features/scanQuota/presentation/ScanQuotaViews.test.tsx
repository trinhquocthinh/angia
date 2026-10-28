import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { quota, view } from '../test/scanQuotaFixtures';
import { FamilyScanQuotaCard } from './FamilyScanQuotaCard';
import { ScanQuotaCard } from './ScanQuotaCard';
import { ScanQuotaOverview } from './ScanQuotaOverview';
import { ScanQuotaEditor } from './ScanQuotaEditor';
const noop = () => undefined;
describe('Giao diện hạn mức lượt', () => {
  it('TC-616: gia đình chỉ xem lượt và hạn mức đang có hiệu lực', () => {
    const html = renderToStaticMarkup(
      <FamilyScanQuotaCard quota={quota} loading={false} error={false} onRetry={noop} />,
    );
    expect(html).toContain('Đã dùng 2 / 12 lượt');
    expect(html).toContain('Đang giữ 1 lượt');
    expect(html).toContain('Còn lại 9 lượt');
    expect(html).not.toContain('chưa dùng để chặn hoặc tính lượt');
    expect(html).not.toContain('USD');
  });
  it('TC-593: tải, lỗi, chưa xác định và chưa cấp lượt không biến thành số 0', () => {
    const render = (loading: boolean, error: boolean, data: typeof quota | null = null) =>
      renderToStaticMarkup(
        <FamilyScanQuotaCard quota={data} loading={loading} error={error} onRetry={noop} />,
      );
    expect(render(true, false)).toContain('Đang tải');
    expect(render(false, true)).toContain('Không thể tải');
    expect(render(false, false)).toContain('Chưa xác định');
    expect(render(false, false)).not.toContain('Đã dùng 0');
    expect(
      renderToStaticMarkup(
        <FamilyScanQuotaCard
          quota={{
            ...quota,
            status: 'unconfigured',
            grantedScans: 0,
            usedScans: 0,
            heldScans: 0,
            remainingScans: 0,
          }}
          loading={false}
          error={false}
          onRetry={noop}
        />,
      ),
    ).toContain('Chưa cấp lượt tháng này');
  });
  it('TC-592: phí chưa xác định khác 0 và cảnh báo ngân sách/chính sách chưa đủ', () => {
    const html = renderToStaticMarkup(<ScanQuotaOverview view={view} />);
    expect(html).toContain('Chưa xác định');
    expect(html).toContain('Chưa thể xác định lượt cấp thêm');
    expect(html).not.toContain('Phí thực: 0');
  });
  it('TC-592: tải lại lỗi giữ editor nhưng không hiện tổng quan cũ như đã xác minh', () => {
    const state = {
      config: {
        data: {
          ...view,
          billingStatus: 'ready',
          actualSpendUsd: '0.000000000000',
          availableAdditionalScans: '99',
        },
        isError: true,
        isFetching: false,
        error: new Error('PRIVATE_DETAIL'),
      },
      mutation: { isPending: false, error: null, isSuccess: false },
      grant: async () => undefined,
    } as unknown as ComponentProps<typeof ScanQuotaCard>['state'];
    const html = renderToStaticMarkup(<ScanQuotaCard state={state} />);
    expect(html).toContain('Không thể tải hạn mức lượt');
    expect(html).toContain('Duyệt lượt tháng');
    expect(html).not.toContain('Đối soát: Đủ dữ liệu');
    expect(html).not.toContain('Có thể cấp thêm: 99 lượt');
    expect(html).not.toContain('PRIVATE_DETAIL');
  });
  it('TC-592: danh sách chưa chọn, gợi ý tháng trước chỉ tham khảo, nút duyệt rõ ràng', () => {
    const html = renderToStaticMarkup(
      <ScanQuotaEditor initial={view} pending={false} error={null} saved={false} onGrant={async () => {}} />,
    );
    expect(html).not.toContain('checked=""');
    expect(html).toContain('Tháng trước đã duyệt: 8 lượt');
    expect(html).toContain('Duyệt các gia đình đã chọn');
    expect(html).toContain('Tổng lượt được cấp');
  });
  it('TC-591: mọi thao tác chung khóa pending và lỗi xung đột giữ bản sửa, không lộ message', () => {
    const render = (error: Error) =>
      renderToStaticMarkup(
        <ScanQuotaEditor
          initial={view}
          pending={true}
          error={error}
          saved={false}
          onGrant={async () => {}}
        />,
      );
    expect(render(new AdminRequestError('ERR_SCAN_QUOTA_CONFLICT', 409))).toContain(
      'Bản đang sửa vẫn được giữ',
    );
    expect(render(new Error('PRIVATE_SQL'))).not.toContain('PRIVATE_SQL');
    expect(render(new Error())).toContain('fieldset disabled=""');
  });
  it('TC-645: gia đình dùng lượt mặc định thấy nhãn riêng; Admin không còn form chính sách', () => {
    const html = renderToStaticMarkup(
      <FamilyScanQuotaCard
        quota={{ ...quota, status: 'default' }}
        loading={false}
        error={false}
        onRetry={noop}
      />,
    );
    expect(html).toContain('Lượt mặc định');
    const editor = renderToStaticMarkup(
      <ScanQuotaEditor initial={view} pending={false} error={null} saved={false} onGrant={async () => {}} />,
    );
    expect(editor).not.toContain('Chính sách cấp lượt');
  });
  it('TC-641: tổng quan hiện thông số env và số USD cần nâng khi cấp vượt dự toán', () => {
    const html = renderToStaticMarkup(
      <ScanQuotaOverview
        view={{
          ...view,
          policy: { estimatedCostPerScanUsd: '0.001594000000', reserveBasisPoints: 1500, trialScans: 10 },
          billingStatus: 'ready',
          actualSpendUsd: '0.000000000000',
          availableAdditionalScans: '0',
          overAllocatedScans: '100',
        }}
      />,
    );
    expect(html).toContain('Mặc định 10 lượt/gia đình/tháng');
    expect(html).toContain('dự phòng 15%');
    expect(html).toContain('0,001594 USD/lượt');
    expect(html).toContain('Đang cấp vượt khả năng ngân sách 100 lượt');
    expect(html).toContain('cần nâng chi phí cố định tháng thêm khoảng 0,19 USD');
  });
});
