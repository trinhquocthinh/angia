import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useDeletionCountdown } from './useDeletionCountdown';

const state = vi.hoisted(() => ({ effects: [] as (() => (() => void) | void)[], update: vi.fn() }));
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: () => [Date.now(), state.update],
  useEffect: (effect: () => (() => void) | void) => state.effects.push(effect),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  state.effects = [];
  state.update.mockClear();
});

it('SPEC-069: đếm từ executeAt thật, cập nhật theo đồng hồ và dọn timer khi đóng', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-20T07:00:00Z'));
  const listeners = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('document', listeners);
  let result!: ReturnType<typeof useDeletionCountdown>;
  function Probe() {
    result = useDeletionCountdown('2026-11-20T08:10:00Z');
    return null;
  }
  renderToStaticMarkup(<Probe />);
  expect(result).toEqual({ remaining: '1 giờ 10 phút', expired: false });
  const cleanup = state.effects[0]!();
  vi.advanceTimersByTime(60_000);
  expect(state.update).toHaveBeenLastCalledWith(Date.parse('2026-11-20T07:01:00Z'));
  renderToStaticMarkup(<Probe />);
  expect(result.remaining).toBe('1 giờ 9 phút');
  vi.setSystemTime(new Date('2026-11-20T08:10:00Z'));
  renderToStaticMarkup(<Probe />);
  expect(result).toEqual({ remaining: '0 giờ 0 phút', expired: true });
  cleanup?.();
  expect(vi.getTimerCount()).toBe(0);
  expect(listeners.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
});
