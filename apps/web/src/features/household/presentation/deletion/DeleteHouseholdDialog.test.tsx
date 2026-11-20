import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { HomeDialogShell } from '../home/HomeDialogShell';
import { DeleteHouseholdDialog } from './DeleteHouseholdDialog';

const state = vi.hoisted(() => ({ name: '', shell: null as unknown }));
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: () => [state.name, vi.fn()],
}));
vi.mock('../home/HomeDialogShell', () => ({
  HomeDialogShell: (props: unknown) => {
    state.shell = props;
    return null;
  },
}));
afterEach(() => {
  state.name = '';
});

it.each(['', 'Sai tên', 'nhà Ngọc Lan'])('SPEC-069: tên không khớp %s khoá nút xoá', (name) => {
  state.name = name;
  renderToStaticMarkup(
    <DeleteHouseholdDialog
      familyName="Nhà Ngọc Lan"
      pending={false}
      error={null}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );
  expect((state.shell as React.ComponentProps<typeof HomeDialogShell>).confirmDisabled).toBe(true);
});

it('SPEC-069: bỏ khoảng trắng trước khi so khớp và gửi tên nhà', () => {
  state.name = '  Nhà Ngọc Lan  ';
  const onConfirm = vi.fn();
  renderToStaticMarkup(
    <DeleteHouseholdDialog
      familyName="Nhà Ngọc Lan"
      pending={false}
      error={null}
      onClose={vi.fn()}
      onConfirm={onConfirm}
    />,
  );
  const shell = state.shell as React.ComponentProps<typeof HomeDialogShell>;
  expect(shell.confirmDisabled).toBe(false);
  shell.onConfirm();
  expect(onConfirm).toHaveBeenCalledExactlyOnceWith('Nhà Ngọc Lan');
});
