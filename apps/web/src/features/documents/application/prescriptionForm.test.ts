import { describe, expect, it } from 'vitest';
import {
  emptyPrescriptionItem,
  prescriptionFormSchema,
  toPrescriptionApproval,
  toPrescriptionFormValues,
  type PrescriptionFormValues,
  type PrescriptionItemValues,
} from './prescriptionForm';
import type { PrescriptionPayload } from './reviewPorts';

const item = (patch: Partial<PrescriptionItemValues> = {}): PrescriptionItemValues => ({
  name: 'Amlodipin',
  strength: '5mg',
  quantityPerDose: '1',
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: '30',
  longTerm: false,
  externalUse: false,
  note: '',
  totalQuantity: '',
  fromAi: true,
  ...patch,
});
const values = (patch: Partial<PrescriptionFormValues> = {}): PrescriptionFormValues => ({
  issuedDate: '2026-10-01',
  revisitDate: '',
  facility: 'BV Nhân dân Gia Định',
  diagnosis: 'Tăng huyết áp',
  items: [item()],
  ...patch,
});
const errorsOf = (input: PrescriptionFormValues) => {
  const result = prescriptionFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('Form đối soát đơn thuốc (SPEC-010, BR-025)', () => {
  it('TC-573: không có ngày hẹn thì gửi null, không tự suy diễn', () => {
    expect(toPrescriptionApproval(values())).toHaveProperty('revisitDate', null);
  });
  it('TC-573: giữ ngày hẹn AI, cho sửa và xóa trước khi duyệt', () => {
    const payload = {
      type: 'prescription',
      issuedDate: '2026-10-01',
      revisitDate: '2026-10-31',
      facility: null,
      diagnosis: null,
      items: [],
    } as PrescriptionPayload;
    expect(toPrescriptionFormValues(payload).revisitDate).toBe('2026-10-31');
    expect(toPrescriptionApproval(values({ revisitDate: '2026-11-02' })).revisitDate).toBe('2026-11-02');
    expect(toPrescriptionApproval(values({ revisitDate: '' })).revisitDate).toBeNull();
  });
  it.each(['2026-09-30', '2036-09-29', '2026-02-30'])('TC-472: chặn ngày hẹn sai %s', (revisitDate) => {
    expect(errorsOf(values({ revisitDate }))).toHaveProperty('revisitDate');
  });
  it.each(['2026-10-01', '2036-09-28', '2026-10-31', ''])(
    'TC-472: chấp nhận ngày hẹn %s, kể cả đơn cũ',
    (revisitDate) => {
      expect(errorsOf(values({ revisitDate }))).toEqual({});
    },
  );
  it('điền sẵn từ bản trích xuất; trường null thành ô trống, không suy diễn liều/buổi', () => {
    const payload: PrescriptionPayload = {
      type: 'prescription',
      issuedDate: null,
      revisitDate: null,
      facility: null,
      diagnosis: null,
      items: [
        {
          name: 'Metformin',
          strength: null,
          quantityPerDose: null,
          doseUnit: null,
          slots: [],
          durationDays: null,
          longTerm: false,
          note: 'ngày 2 viên chia 2 lần',
          totalQuantity: 60,
        },
      ],
    };
    expect(toPrescriptionFormValues(payload)).toEqual(
      values({
        issuedDate: '',
        facility: '',
        diagnosis: '',
        items: [
          item({
            name: 'Metformin',
            strength: '',
            quantityPerDose: '',
            doseUnit: '',
            slots: [],
            durationDays: '',
            note: 'ngày 2 viên chia 2 lần',
            totalQuantity: '60',
          }),
        ],
      }),
    );
  });

  it('chưa có bản trích xuất thì mở form với một dòng thuốc trống để nhập theo ảnh', () => {
    expect(toPrescriptionFormValues(null)).toEqual(
      values({ issuedDate: '', facility: '', diagnosis: '', items: [emptyPrescriptionItem()] }),
    );
    expect(emptyPrescriptionItem().fromAi).toBe(false);
  });

  it('chấp nhận đơn đủ ngày kê và đủ liều/buổi/thời gian từng dòng', () => {
    expect(errorsOf(values())).toEqual({});
    expect(errorsOf(values({ items: [item({ durationDays: '', longTerm: true })] }))).toEqual({});
  });

  it('bắt buộc ngày kê đơn (BR-015)', () => {
    expect(errorsOf(values({ issuedDate: '' }))).toEqual({ issuedDate: 'Nhập ngày kê ghi trên đơn.' });
  });

  it('báo lỗi đúng dòng thiếu buổi, liều và số ngày (BR-025)', () => {
    const incomplete = item({ name: 'Metformin', slots: [], quantityPerDose: '', durationDays: '' });
    expect(errorsOf(values({ items: [item(), incomplete] }))).toEqual({
      'items.1.quantityPerDose': 'Nhập số lượng mỗi lần dùng.',
      'items.1.slots': 'Chọn ít nhất một buổi dùng.',
      'items.1.durationDays': 'Nhập số ngày dùng hoặc chọn Dài hạn.',
    });
  });

  it('kiểm tra định dạng tên, liều và số ngày', () => {
    const bad = item({ name: ' ', quantityPerDose: '0', durationDays: '2,5' });
    expect(errorsOf(values({ items: [bad] }))).toEqual({
      'items.0.name': 'Nhập tên thuốc.',
      'items.0.quantityPerDose': 'Nhập số lớn hơn 0, ví dụ 1 hoặc 0,5.',
      'items.0.durationDays': 'Nhập số ngày là số nguyên dương.',
    });
  });

  it('đơn thuốc phải còn ít nhất một dòng', () => {
    expect(errorsOf(values({ items: [] }))).toEqual({ items: 'Đơn thuốc cần ít nhất một dòng thuốc.' });
  });

  it('chuyển form thành bản đối soát: ô trống thành null, dài hạn bỏ số ngày, dấu phẩy thập phân', () => {
    const approval = toPrescriptionApproval(
      values({
        facility: ' ',
        diagnosis: ' Tăng huyết áp ',
        items: [item({ quantityPerDose: '0,5', longTerm: true, durationDays: '30', note: ' sau ăn ' })],
      }),
    );
    expect(approval).toEqual({
      type: 'prescription',
      revisitDate: null,
      issuedDate: '2026-10-01',
      facility: null,
      diagnosis: 'Tăng huyết áp',
      items: [
        {
          name: 'Amlodipin',
          strength: '5mg',
          quantityPerDose: 0.5,
          externalUse: false,
          doseUnit: 'viên',
          slots: ['morning'],
          durationDays: null,
          longTerm: true,
          note: 'sau ăn',
          totalQuantity: null,
        },
      ],
    });
  });

  it('giữ thứ tự buổi Sáng → Tối dù người duyệt chọn lộn xộn', () => {
    const approval = toPrescriptionApproval(values({ items: [item({ slots: ['evening', 'morning'] })] }));
    expect(approval.items[0]?.slots).toEqual(['morning', 'evening']);
  });

  it('tổng số lượng tùy chọn; nhập thì phải là số > 0 và được gửi kèm bản đối soát (E3-S3-T3)', () => {
    expect(errorsOf(values({ items: [item({ totalQuantity: '0' })] }))).toEqual({
      'items.0.totalQuantity': 'Nhập số lớn hơn 0 hoặc để trống.',
    });
    const approval = toPrescriptionApproval(values({ items: [item({ totalQuantity: '30' })] }));
    expect(approval.items[0]!.totalQuantity).toBe(30);
    expect(toPrescriptionApproval(values()).items[0]!.totalQuantity).toBeNull();
  });

  it('TC-243: thuốc dùng ngoài được trống liều mỗi lần, vẫn bắt buộc buổi và số ngày', () => {
    const external = item({ name: 'Betamethason', quantityPerDose: '', doseUnit: 'tuýp', externalUse: true });
    expect(errorsOf(values({ items: [external] }))).toEqual({});
    expect(errorsOf(values({ items: [{ ...external, slots: [], durationDays: '' }] }))).toEqual({
      'items.0.slots': 'Chọn ít nhất một buổi dùng.',
      'items.0.durationDays': 'Nhập số ngày dùng hoặc chọn Dài hạn.',
    });
    expect(errorsOf(values({ items: [{ ...external, quantityPerDose: '0' }] }))).toEqual({
      'items.0.quantityPerDose': 'Nhập số lớn hơn 0, ví dụ 1 hoặc 0,5.',
    });
    expect(errorsOf(values({ items: [{ ...external, externalUse: false }] }))).toEqual({
      'items.0.quantityPerDose': 'Nhập số lượng mỗi lần dùng.',
    });
  });

  it('TC-249: dòng "Khi cần" được trống liều mỗi lần, vẫn bắt buộc số ngày', () => {
    const asNeeded = item({ quantityPerDose: '', slots: ['as_needed'] });
    expect(errorsOf(values({ items: [asNeeded] }))).toEqual({});
    expect(errorsOf(values({ items: [{ ...asNeeded, durationDays: '' }] }))).toEqual({
      'items.0.durationDays': 'Nhập số ngày dùng hoặc chọn Dài hạn.',
    });
    expect(toPrescriptionApproval(values({ items: [asNeeded] })).items[0]).toMatchObject({
      slots: ['as_needed'],
      quantityPerDose: null,
    });
  });

  it('TC-241: bản đối soát gửi cờ dùng ngoài và liều trống thành null', () => {
    const approval = toPrescriptionApproval(
      values({ items: [item({ quantityPerDose: ' ', externalUse: true })] }),
    );
    expect(approval.items[0]).toMatchObject({ quantityPerDose: null, externalUse: true });
  });

  it('bản trích xuất AI luôn mở với cờ dùng ngoài tắt — người duyệt tự bật', () => {
    expect(toPrescriptionFormValues(null).items[0]!.externalUse).toBe(false);
  });
});
