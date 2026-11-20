import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useIsDesktopLayout } from './useIsDesktopLayout';

const state = vi.hoisted(() => ({
  effects: [] as (() => (() => void) | void)[],
  update: vi.fn(),
}));

vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: (init: () => boolean) => [init(), state.update],
  useEffect: (effect: () => (() => void) | void) => state.effects.push(effect),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  state.effects = [];
  state.update.mockClear();
});

it('E28-S3-T2b: đọc trạng thái desktop ≥1024px và lắng nghe sự kiện đổi kích thước màn hình', () => {
  let changeHandler: ((event: { matches: boolean }) => void) | undefined;
  const mediaQuery = {
    matches: false,
    addEventListener: vi.fn((_type: string, cb: (event: { matches: boolean }) => void) => {
      changeHandler = cb;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('window', { matchMedia: vi.fn(() => mediaQuery) });

  let result = true;
  function Probe() {
    result = useIsDesktopLayout();
    return null;
  }

  renderToStaticMarkup(<Probe />);
  expect(result).toBe(false);

  const cleanup = state.effects[0]?.();
  changeHandler?.({ matches: true });
  expect(state.update).toHaveBeenCalledWith(true);

  cleanup?.();
  expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});
