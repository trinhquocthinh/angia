import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { events, profileId } from '../test/fixtures.test-helper';
import { ProfileTabs } from '@src/features/measurements/presentation/components/ProfileTabs';
import { TimelineFeed } from './TimelineFeed';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    'aria-current': current,
  }: {
    children: ReactNode;
    to: string;
    params: Record<string, string>;
    'aria-current'?: 'page';
  }) => (
    <a
      aria-current={current}
      href={to
        .replace('$profileId', params.profileId!)
        .replace('$prescriptionId', params.prescriptionId ?? '')}
    >
      {children}
    </a>
  ),
}));
const props = {
  profileId,
  items: events,
  loading: false,
  error: null,
  fetchingMore: false,
  hasNextPage: false,
  retry: vi.fn(),
  loadMore: vi.fn(),
};
describe('TC-503/504/505 — giao diện dòng thời gian', () => {
  it('hiện sáu loại theo thứ tự, dữ liệu gốc và liên kết đơn; không có nhận định', () => {
    const html = renderToStaticMarkup(<TimelineFeed {...props} />);
    const labels = [
      'Đơn thuốc',
      'Phiếu xét nghiệm',
      'Số đo',
      'Dừng thuốc',
      'Giai đoạn thực tế',
      'Lịch tái khám',
    ];
    for (const label of labels) expect(html).toContain(label);
    for (let i = 1; i < labels.length; i++)
      expect(html.indexOf(labels[i - 1]!)).toBeLessThan(html.indexOf(labels[i]!));
    for (const text of [
      '30/10/2026',
      '09:30',
      'Phòng khám An',
      'Nội dung trên đơn',
      '2 dòng thuốc',
      'Thêm: 1',
      'Bỏ: 0',
      'Thay đổi: 1',
      'Glucose',
      '5.2',
      '3.9–6.4',
      '5,25 mmol/L',
      'Thuốc A',
      'Thuốc B',
      'Đang dùng',
    ])
      expect(html).toContain(text);
    expect(html).toContain(`/profiles/${profileId}/prescriptions/${events[0]!.id}`);
    expect(html).not.toMatch(/bất thường|tốt hơn|xấu hơn|khuyên dùng|Đã dùng/);
  });
  it('hỗ trợ null, không so sánh đơn đầu và giữ đủ kết quả xét nghiệm, lịch hẹn gom', () => {
    const prescription = events[0]!;
    const lab = events[1]!;
    const revisit = events[5]!;
    if (prescription.kind !== 'prescription' || lab.kind !== 'lab_result' || revisit.kind !== 'revisit')
      throw new Error('fixture');
    const html = renderToStaticMarkup(
      <TimelineFeed
        {...props}
        items={[
          {
            ...prescription,
            data: { ...prescription.data, facility: null, diagnosis: null, diffSummary: null },
          },
          {
            ...lab,
            data: {
              ...lab.data,
              results: [
                ...lab.data.results,
                {
                  ...lab.data.results[0]!,
                  id: 'other',
                  testName: 'HbA1c',
                  value: '6.1',
                  unit: '%',
                  referenceRange: null,
                },
              ],
            },
          },
          { ...revisit, data: { prescriptionIds: [...revisit.data.prescriptionIds, 'other'] } },
          { ...events[4]!, kind: 'adherence_period', data: { medicationName: 'Thuốc C', status: 'stopped' } },
        ]}
      />,
    );
    expect(html).not.toContain('Thay đổi:');
    for (const text of ['HbA1c', '6.1', 'Lịch hẹn từ 2 đơn thuốc', 'Đã dừng']) expect(html).toContain(text);
  });
  it('có trạng thái rỗng, tải và nút xem thêm bị khóa khi đang tải', () => {
    expect(renderToStaticMarkup(<TimelineFeed {...props} items={[]} />)).toContain(
      'Chưa có sự kiện sức khỏe đã ghi nhận.',
    );
    expect(renderToStaticMarkup(<TimelineFeed {...props} items={undefined} loading />)).toContain(
      'Đang tải dòng thời gian',
    );
    expect(renderToStaticMarkup(<TimelineFeed {...props} hasNextPage />)).toContain('Xem thêm');
    const html = renderToStaticMarkup(<TimelineFeed {...props} hasNextPage fetchingMore />);
    expect(html).toContain('disabled');
    expect(html).toContain('Đang tải thêm');
  });
  it('hiển thị huyết áp và mạch theo giá trị ghi nhận', () => {
    const event = events[2]!;
    if (event.kind !== 'measurement') throw new Error('fixture');
    const html = renderToStaticMarkup(
      <TimelineFeed
        {...props}
        items={[
          {
            ...event,
            data: {
              ...event.data,
              kind: 'blood_pressure',
              systolic: 120,
              diastolic: 80,
              pulse: 72,
              glucoseValue: null,
              glucoseUnit: null,
            },
          },
        ]}
      />,
    );
    expect(html).toContain('Huyết áp: 120/80 mmHg');
    expect(html).toContain('Mạch: 72 lần/phút');
  });
  it.each([401, 403, 404, 409, 500])('lỗi %s có thông báo, thử lại và không lộ danh sách cũ', (status) => {
    const html = renderToStaticMarkup(
      <TimelineFeed {...props} error={Object.assign(new Error('nội bộ'), { status })} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Thử lại');
    expect(html).not.toContain('Thuốc A');
    expect(html).not.toContain('nội bộ');
    if (status === 409) expect(html).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    if (status === 404) expect(html).toContain('Không tìm thấy hồ sơ này.');
  });
  it('tab dòng thời gian vẫn hiện và được chọn khi ẩn số đo', () => {
    const html = renderToStaticMarkup(
      <ProfileTabs profileId={profileId} active="timeline" showsVitals={false} />,
    );
    expect(html).toContain('Dòng thời gian');
    expect(html).toContain(`/profiles/${profileId}/timeline`);
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('Diễn biến sức khỏe');
  });
});
