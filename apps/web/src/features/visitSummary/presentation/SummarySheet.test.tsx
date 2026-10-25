import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Measurement, VisitSummary } from '@angia/contracts';
import { SummarySheet } from './SummarySheet';
import { SummaryStates } from './SummaryStates';
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: unknown }) => children }));

const measurement: Measurement = {
  id: 'm0',
  healthProfileId: 'p',
  sourceDocumentId: 'doc',
  kind: 'blood_pressure',
  measuredOn: '2026-09-01',
  measuredTime: '07:30',
  systolic: 128,
  diastolic: 82,
  pulse: 76,
  glucoseValue: null,
  glucoseUnit: null,
  manualWithoutSource: false,
  createdAt: '2026-09-01T01:00:00.000Z',
};
const summary: VisitSummary = {
  profile: { id: '0192f000-0000-7000-8000-000000000001', displayName: 'Mẹ', birthYear: 1954 },
  createdAt: '2026-10-05T03:00:00.000Z',
  from: '2026-07-05',
  to: '2026-10-05',
  currentMedications: [
    {
      id: 'c1',
      healthProfileId: 'p',
      prescriptionItemId: 'i1',
      source: 'prescription',
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      startDate: '2026-10-01',
      endDate: null,
      status: 'active',
      prescriptionIssuedDate: '2026-10-01',
    },
  ],
  measurements: [
    measurement,
    {
      ...measurement,
      id: 'g',
      kind: 'glucose',
      systolic: null,
      diastolic: null,
      pulse: null,
      glucoseValue: 7.4,
      glucoseUnit: 'mmol/L',
    },
  ],
  latestLabResults: [
    {
      id: 'l1',
      healthProfileId: 'p',
      sourceDocumentId: 'doc',
      resultDate: '2026-10-01',
      testName: 'HbA1c',
      value: '7,1',
      unit: '%',
      referenceRange: '4,0 – 6,0',
      facility: 'BV Nhân dân Gia Định',
      manualWithoutSource: false,
      createdAt: '2026-10-01T08:00:00.000Z',
    },
  ],
  adherencePeriods: [
    {
      id: 'a1',
      healthProfileId: 'p',
      medicationName: 'Canxi',
      status: 'stopped',
      fromDate: '2026-08-02',
      toDate: '2026-08-16',
    },
  ],
  disclaimer: 'Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.',
};
const render = (data: VisitSummary = summary) => renderToStaticMarkup(<SummarySheet summary={data} />);

describe('Bản tóm tắt đi khám A4 (Design v0.1 §7, E6-S1-T2)', () => {
  it('TC-093 — đầu trang tên + tuổi, khoảng dữ liệu; chân trang dòng miễn trừ + ngày tạo (BR-035)', () => {
    const html = render();
    expect(html).toContain('AN GIA · TÓM TẮT SỨC KHỎE');
    expect(html).toContain('Mẹ · 72 tuổi');
    expect(html).toContain('05/07/2026 – 05/10/2026');
    expect(html).toContain('Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.');
    expect(html).toContain('Tạo ngày 05/10/2026');
  });

  it('TC-093 — đủ thuốc đang dùng, số đo gộp dòng, xét nghiệm gần nhất, giai đoạn dùng thuốc', () => {
    const html = render();
    expect(html).toContain('Amlodipin 5mg');
    expect(html).toContain('1 viên · sáng');
    expect(html).toContain('Đơn 01/10/2026');
    expect(html).toContain('128/82');
    expect(html).toContain('7,4 mmol/L');
    expect(html).toContain('HbA1c');
    expect(html).toContain('4,0 – 6,0');
    expect(html).toContain('Ngưng 02/08/2026 – 16/08/2026');
  });

  it('BR-033 — không có chữ nhận định hay tô màu so với khoảng tham chiếu', () => {
    expect(render()).not.toMatch(/bình thường|bất thường|cao|thấp|tốt|xấu|cần chú ý/i);
  });

  it('nhiều số đo → bảng số đo chuyển chế độ nén toàn chiều ngang', () => {
    const many = Array.from({ length: 40 }, (_, index) => ({
      ...measurement,
      id: `m${index}`,
      measuredOn: `2026-09-${String(1 + (index % 28)).padStart(2, '0')}`,
      measuredTime: index < 28 ? '07:30' : '19:00',
    }));
    const html = render({ ...summary, measurements: many });
    expect(html).toContain('summary-measurements--wide');
  });

  it('mục trống vẫn hiện tiêu đề kèm dòng "Không có" thay vì bỏ mục', () => {
    const html = render({
      ...summary,
      currentMedications: [],
      latestLabResults: [],
      adherencePeriods: [],
    });
    expect(html).toContain('Không có thuốc đang dùng tại ngày tạo.');
    expect(html).toContain('Không có kết quả xét nghiệm.');
    expect(html).toContain('Không có giai đoạn dùng thuốc trong khoảng này.');
  });
});

describe('Trạng thái màn tóm tắt (Design §6)', () => {
  const states = (props: Partial<Parameters<typeof SummaryStates>[0]>) =>
    renderToStaticMarkup(<SummaryStates loading={false} error={false} retry={() => undefined} {...props} />);

  it('đang tải, lỗi tải, rỗng', () => {
    expect(states({ loading: true })).toContain('Đang tạo bản tóm tắt');
    expect(states({ error: true })).toContain('Không tải được bản tóm tắt.');
    expect(states({})).toContain('Chưa đủ dữ liệu để kết xuất tóm tắt');
  });
});
