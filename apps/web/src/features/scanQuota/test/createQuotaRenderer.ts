import { isValidElement, useState, type ReactNode, type ReactElement } from 'react';
import { vi } from 'vitest';
interface QuotaTestNode {
  type: string;
  props: {
    id?: string;
    type?: string;
    checked?: boolean;
    disabled?: boolean;
    value?: string;
    children?: ReactNode;
    role?: string;
    onChange?(event: { target: { value: string; checked: boolean } }): void;
    onSubmit?(event: { preventDefault(): void }): void;
  };
}
// Chỉ kiểm thử hook useState và handler React thuần; không thay DOM hoặc cơ chế Query.
export function createQuotaRenderer() {
  const states = new Map<string, unknown[]>();
  let active: unknown[] = [];
  let cursor = 0;
  let nodes: QuotaTestNode[] = [];
  let text = '';
  vi.mocked(useState).mockImplementation(((initial: unknown) => {
    const slots = active;
    const slot = cursor++;
    if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
    const update = (value: unknown) => {
      slots[slot] = typeof value === 'function' ? value(slots[slot]) : value;
    };
    return [slots[slot], update];
  }) as typeof useState);
  const visit = (node: ReactNode, path: string): void => {
    if (Array.isArray(node)) return node.forEach((child, index) => visit(child, `${path}.${index}`));
    if (typeof node === 'string' || typeof node === 'number') {
      text += `${node}`;
      return;
    }
    if (!isValidElement(node)) return;
    const element = node as ReactElement<{ children?: ReactNode }>;
    const key = `${path}:${element.key ?? ''}`;
    if (typeof element.type === 'function') {
      active = states.get(key) ?? [];
      states.set(key, active);
      cursor = 0;
      visit((element.type as (props: unknown) => ReactNode)(element.props), key);
      return;
    }
    if (typeof element.type === 'string') nodes.push(element as unknown as QuotaTestNode);
    visit(element.props.children, key);
  };
  return {
    render(root: ReactNode) {
      nodes = [];
      text = '';
      visit(root, 'root');
    },
    get nodes() {
      return nodes;
    },
    get text() {
      return text;
    },
    change(id: string, value: string) {
      nodes.find((node) => node.props.id === id)!.props.onChange!({ target: { value, checked: false } });
    },
    select(index: number, checked: boolean) {
      nodes.filter((node) => node.props.type === 'checkbox')[index]!.props.onChange!({
        target: { value: '', checked },
      });
    },
    submit(index: number) {
      nodes.filter((node) => node.type === 'form')[index]!.props.onSubmit!({ preventDefault() {} });
    },
  };
}
