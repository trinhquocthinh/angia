import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { DocumentUploadLink } from './DocumentUploadLink';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));

it('E30-S1-T1: màn Giấy tờ có lối vào chụp hoặc chọn ảnh', () => {
  const html = renderToStaticMarkup(<DocumentUploadLink />);
  expect(html).toContain('href="/upload"');
  expect(html).toContain('Chụp / chọn ảnh');
});
