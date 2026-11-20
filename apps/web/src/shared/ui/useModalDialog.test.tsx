import type * as React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './button/Button';
import { useModalDialog } from './useModalDialog';

const lifecycle = vi.hoisted(() => ({
  mount: undefined as (() => void | (() => void)) | undefined,
  dialog: {} as Record<string, unknown>,
}));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useRef: () => ({ current: lifecycle.dialog }),
  useEffect: (mount: () => void | (() => void)) => {
    lifecycle.mount = mount;
  },
}));

afterEach(() => vi.unstubAllGlobals());

function openDialog(connected = true, hasTarget = true, explicit = false) {
  // Môi trường unit là Node: giả lập phần DOM mà hook sử dụng, gồm showModal/close.
  class Element {
    isConnected = connected;
    focus = vi.fn();
  }
  const trigger = new Element();
  const target = new Element();
  const fallback = new Element();
  fallback.isConnected = true;
  const explicitTrigger = new Element();
  let open = false;
  lifecycle.dialog = {
    showModal: () => {
      open = true;
    },
    close: () => {
      open = false;
    },
    closest: vi.fn(() => fallback),
    querySelector: vi.fn(() => {
      expect(open).toBe(true);
      return hasTarget ? target : null;
    }),
  };
  vi.stubGlobal('HTMLElement', Element);
  vi.stubGlobal('document', { activeElement: trigger });
  function Probe() {
    useModalDialog(explicit ? { current: explicitTrigger as unknown as HTMLButtonElement } : undefined);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  const cleanup = lifecycle.mount?.();
  return { trigger, target, fallback, explicitTrigger, cleanup };
}

it('mở dialog thì focus phần tử data-autofocus đầu tiên sau khi showModal', () => {
  const { target, cleanup } = openDialog();
  expect(lifecycle.dialog.querySelector).toHaveBeenCalledWith('[data-autofocus]');
  expect(target.focus).toHaveBeenCalledOnce();
  cleanup?.();
});

it('gỡ dialog thì trả focus về phần tử đã mở', () => {
  const { trigger, cleanup } = openDialog();
  cleanup?.();
  expect(trigger.focus).toHaveBeenCalledOnce();
});

it('không có data-autofocus vẫn mở, không trả focus cho phần tử đã gỡ', () => {
  const { trigger, target, cleanup } = openDialog(false, false);
  expect(target.focus).not.toHaveBeenCalled();
  cleanup?.();
  expect(trigger.focus).not.toHaveBeenCalled();
});

it('Button chuyển tiếp data-autofocus xuống nút HTML', () => {
  expect(renderToStaticMarkup(<Button data-autofocus>Huỷ</Button>)).toContain('data-autofocus="true"');
});

it('nút mở đã biến mất sau tự gỡ thì focus về thẻ giám hộ', () => {
  const { fallback, cleanup } = openDialog(false);
  cleanup?.();
  expect(fallback.focus).toHaveBeenCalledOnce();
});

it('popup thành viên trả focus về nút mở được chỉ định', () => {
  const { trigger, explicitTrigger, cleanup } = openDialog(true, true, true);
  cleanup?.();
  expect(explicitTrigger.focus).toHaveBeenCalledOnce();
  expect(trigger.focus).not.toHaveBeenCalled();
});
