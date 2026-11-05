import { describe, expect, it } from 'vitest';
import { doseConfirmationAccess } from './doseConfirmationAccess.js';

const main = { accountId: 'main', isMain: true };
const otherMain = { accountId: 'other-main', isMain: true };
const linkedMember = { accountId: 'linked', isMain: false };
const otherMember = { accountId: 'other', isMain: false };
const linkedProfile = { linked: true, recipientIds: ['linked'] };
const childProfile = { linked: false, recipientIds: ['main'] };
const confirmedBy = (accountId: string | null) => ({ confirmedBy: { accountId } });

describe('doseConfirmationAccess (SPEC-046, BR-053)', () => {
  it('TC-486, TC-487: hồ sơ liên kết: tài khoản liên kết và mọi main được xác nhận, member khác thì không', () => {
    expect(doseConfirmationAccess(linkedMember, linkedProfile, null).mayConfirm).toBe(true);
    expect(doseConfirmationAccess(main, linkedProfile, null).mayConfirm).toBe(true);
    expect(doseConfirmationAccess(otherMember, linkedProfile, null).mayConfirm).toBe(false);
  });
  it('TC-488: hồ sơ không liên kết: chỉ người nhận hiện hành, main không được chỉ định thì không', () => {
    expect(doseConfirmationAccess(main, childProfile, null).mayConfirm).toBe(true);
    expect(doseConfirmationAccess(otherMain, childProfile, null).mayConfirm).toBe(false);
    expect(doseConfirmationAccess(otherMember, childProfile, null).mayConfirm).toBe(false);
  });
  it('TC-491: hủy: người đã xác nhận hoặc main; member khác thì không', () => {
    const byLinked = confirmedBy('linked');
    expect(doseConfirmationAccess(linkedMember, linkedProfile, byLinked).mayUndo).toBe(true);
    expect(doseConfirmationAccess(main, linkedProfile, byLinked).mayUndo).toBe(true);
    expect(doseConfirmationAccess(otherMain, childProfile, confirmedBy('main')).mayUndo).toBe(true);
    expect(doseConfirmationAccess(otherMember, linkedProfile, byLinked).mayUndo).toBe(false);
  });
  it('TC-491: tài khoản liên kết không hủy được bản do main ghi, kể cả khi tài khoản xác nhận đã xóa', () => {
    expect(doseConfirmationAccess(linkedMember, linkedProfile, confirmedBy('main')).mayUndo).toBe(false);
    expect(doseConfirmationAccess(linkedMember, linkedProfile, confirmedBy(null)).mayUndo).toBe(false);
    expect(doseConfirmationAccess(main, linkedProfile, confirmedBy(null)).mayUndo).toBe(true);
  });
  it('Chưa có bản ghi: hủy lặp không lỗi với người có quyền, member khác vẫn bị chặn', () => {
    expect(doseConfirmationAccess(linkedMember, linkedProfile, null).mayUndo).toBe(true);
    expect(doseConfirmationAccess(otherMain, childProfile, null).mayUndo).toBe(true);
    expect(doseConfirmationAccess(otherMember, linkedProfile, null).mayUndo).toBe(false);
  });
});
