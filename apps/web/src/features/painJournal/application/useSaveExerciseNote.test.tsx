import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../test/painIssues.test-helper';
import { useSaveExerciseNote } from './useSaveExerciseNote';
import type { ExerciseNoteWriter } from './ports';
const exercise = {
  id: issue.id,
  name: 'Duỗi gối',
  source: 'self' as const,
  prescriber: null,
  startDate: '2026-11-05',
  endDate: null,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
function probe(api: ExerciseNoteWriter, current = session, scope: 'main' | 'self' = 'main') {
  const client = new QueryClient();
  let state!: ReturnType<typeof useSaveExerciseNote>;
  function Probe() {
    state = useSaveExerciseNote(api, current, profile, scope, issue.id);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state, client };
}
it('TC-695: self lưu bài tập, làm mới chi tiết/bối cảnh cùng hồ sơ và không chạm hồ sơ khác', async () => {
  const api = { createExercise: vi.fn(async () => exercise), updateExercise: vi.fn(async () => exercise) };
  const { state, client } = probe(api, { ...session, role: 'member' }, 'self');
  const key = ['profiles', 'a', 'f', 'pain', 'self', 'p', 'detail', issue.id];
  const context = ['profiles', 'a', 'f', 'pain', 'self', 'p', 'context', issue.id];
  const other = ['profiles', 'a', 'f', 'pain', 'self', 'q', 'detail', issue.id];
  for (const k of [key, context, other]) client.setQueryData(k, {});
  expect(await state.save({ name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' })).toBe(true);
  expect(api.createExercise).toHaveBeenCalledWith(
    null,
    issue.id,
    { name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' },
    'csrf',
    expect.any(AbortSignal),
  );
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(context)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  expect(await state.save({ endDate: null }, exercise.id)).toBe(true);
  expect(api.updateExercise).toHaveBeenCalledWith(
    null,
    issue.id,
    exercise.id,
    { endDate: null },
    'csrf',
    expect.any(AbortSignal),
  );
  client.clear();
});
it('TC-692: không gửi khi mất quyền, chống gửi lặp và cho thử lại sau lỗi', async () => {
  let finish!: () => void;
  const api = {
    createExercise: vi.fn(
      () =>
        new Promise<typeof exercise>((r) => {
          finish = () => r(exercise);
        }),
    ),
    updateExercise: vi.fn(async () => exercise),
  };
  const denied = probe(api, { ...session, csrfToken: '' });
  const body = { name: 'Duỗi gối', source: 'self' as const, startDate: '2026-11-05' };
  expect(await denied.state.save(body)).toBe(false);
  expect(api.createExercise).not.toHaveBeenCalled();
  denied.client.clear();
  const { state, client } = probe(api);
  const first = state.save(body);
  expect(await state.save(body)).toBe(false);
  finish();
  expect(await first).toBe(true);
  api.updateExercise.mockRejectedValueOnce(new Error('Mạng'));
  expect(await state.save({ endDate: null }, exercise.id)).toBe(false);
  expect(await state.save({ endDate: null }, exercise.id)).toBe(true);
  client.clear();
});
