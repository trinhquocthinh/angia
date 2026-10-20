import { expect, it } from 'vitest';
import { classifyObjectKey } from './classifyObjectKey.js';

const F = '0199a000-0000-7000-8000-000000000001';
const P = '0199a000-0000-7000-8000-000000000002';
const D = '0199a000-0000-7000-8000-000000000003';
const U = '0199a000-0000-7000-8000-000000000004';
const base = `families/${F}/profiles/${P}/documents/${D}`;

it('TC-312: nhận đúng ảnh gốc, preview WebP và PNG OCR của gia đình', () => {
  for (const ext of ['jpg', 'png', 'webp', 'heic'])
    expect(classifyObjectKey(`${base}/original.${ext}`, F)).toBe('original');
  expect(classifyObjectKey(`${base}/previews/${U}.webp`, F)).toBe('preview');
  expect(classifyObjectKey(`${base}/ocr/${U}/${U}.png`, F)).toBe('ocr');
  expect(classifyObjectKey(`${base}/previews/${U.toUpperCase()}.webp`, F)).toBe('preview');
});

it('TC-313: khóa sai dạng hoặc khác gia đình là unknown', () => {
  const other = '0199a000-0000-7000-8000-0000000000ff';
  for (const key of [
    `${base}/original.gif`,
    `${base}/original.JPG`,
    `${base}/Previews/${U}.webp`,
    `${base}/previews/${U}.WEBP`,
    `${base}/original.jpg.bak`,
    `${base}/previews/x.webp`,
    `${base}/previews/${U}.png`,
    `${base}/ocr/${U}.png`,
    `${base}/ocr/${U}/${U}.webp`,
    `${base}/`,
    `${base}/../${D}/original.jpg`,
    `families/${F}/other.txt`,
    `families/${other}/profiles/${P}/documents/${D}/original.jpg`,
  ])
    expect(classifyObjectKey(key, F)).toBe('unknown');
  expect(classifyObjectKey(`${base}/original.jpg`, F.toUpperCase())).toBe('unknown');
});
