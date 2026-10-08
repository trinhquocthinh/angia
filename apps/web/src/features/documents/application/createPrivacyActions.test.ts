import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { PrivacyDraft } from '@angia/contracts';
import type { PrivacyRepository } from './privacyPorts';
import { createPrivacyActions } from './createPrivacyActions';
import { initialPrivacyEditor } from './initialPrivacyEditor';
import { canApprovePrivacy } from './canApprovePrivacy';
import { privacyEditorReducer } from './privacyEditorState';
const ready: PrivacyDraft = {
  state: 'ready',
  draftId: 'draft',
  sha256: 'a'.repeat(64),
  imageUrl: '/api/image',
};
function setup() {
  const calls: unknown[] = [];
  const client = new QueryClient();
  client.setQueryData(['review', 'account', 'family'], []);
  let state = initialPrivacyEditor();
  const repository: PrivacyRepository = {
    read: async () => ({ state: 'none' }),
    create: async (...args) => {
      calls.push(args);
      return ready;
    },
    approve: async (...args) => {
      calls.push(args);
      return { id: 'document', status: 'extracting' } as never;
    },
    manual: async (...args) => {
      calls.push(args);
      return { id: 'document', status: 'manual_entry' } as never;
    },
  };
  const dispatch = (action: Parameters<typeof privacyEditorReducer>[1]) => {
    state = privacyEditorReducer(state, action);
  };
  const actions = (data: PrivacyDraft = { state: 'none' }, queryError = false) =>
    createPrivacyActions({
      repository,
      id: 'document',
      csrfToken: 'csrf',
      state,
      client,
      key: ['privacy'],
      reviewKey: ['review', 'account', 'family'],
      data,
      queryError,
      dispatch,
      run: async (task) => task(),
    });
  return { client, calls, repository, actions, dispatch, getState: () => state };
}
describe('Lệnh tạo và duyệt bản ảnh', () => {
  it('TC-206a: hoàn thành POST sau khi sửa không mở lại xác nhận', async () => {
    const test = setup();
    let resolve!: (draft: PrivacyDraft) => void;
    let started!: () => void;
    const requested = new Promise<void>((done) => {
      started = done;
    });
    test.repository.create = () =>
      new Promise((done) => {
        resolve = done;
        started();
      });
    const creating = test.actions().create();
    await requested;
    test.dispatch({ type: 'rotate' });
    resolve(ready);
    await creating;
    test.dispatch({ type: 'loaded', draftId: 'draft', sha256: 'a'.repeat(64) });
    test.dispatch({ type: 'check', checked: true });
    expect(canApprovePrivacy(test.getState())).toBe(false);
    expect(test.client.getQueryData(['privacy'])).toEqual({ draft: ready, revision: 0 });
    test.client.clear();
  });
  it('TC-211a: chưa biết trạng thái, đang tạo hoặc lỗi đọc trạng thái không gửi thêm POST', async () => {
    const test = setup();
    await test.actions({ state: 'pending', draftId: 'pending' }).create();
    await test.actions({ state: 'none' }, true).create();
    expect(test.calls).toEqual([]);
    test.client.clear();
  });
  it('TC-204a: gửi đúng hash đã xem, sửa ảnh thì không gửi approval', async () => {
    const test = setup();
    test.dispatch({ type: 'remote', draft: ready, revision: 0 });
    await test.actions().approve();
    expect(test.calls).toEqual([]);
    test.dispatch({ type: 'loaded', draftId: 'draft', sha256: 'a'.repeat(64) });
    test.dispatch({ type: 'check', checked: true });
    await test.actions().approve();
    expect(test.calls).toEqual([
      ['document', { draftId: 'draft', sha256: 'a'.repeat(64), confirmed: true }, 'csrf'],
    ]);
    expect(test.client.getQueryState(['review', 'account', 'family'])?.isInvalidated).toBe(true);
    test.dispatch({ type: 'rotate' });
    await test.actions().approve();
    expect(test.calls).toHaveLength(1);
    test.client.clear();
  });
  it('TC-219a: chọn nhập tay thành công làm mới trạng thái hàng đợi', async () => {
    const test = setup();
    await test.actions().manual();
    expect(test.calls).toEqual([['document', 'csrf']]);
    expect(test.client.getQueryState(['review', 'account', 'family'])?.isInvalidated).toBe(true);
    test.client.clear();
  });
});
