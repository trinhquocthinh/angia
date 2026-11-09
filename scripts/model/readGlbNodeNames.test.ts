import { describe, expect, it } from 'vitest';
import { readGlbNodeNames } from './readGlbNodeNames.js';

/** Dựng GLB tối thiểu: header 12 byte + chunk JSON (đệm khoảng trắng tới bội số 4). */
const glbWith = (json: unknown): Uint8Array => {
  const text = JSON.stringify(json);
  const padded = text + ' '.repeat((4 - (text.length % 4)) % 4);
  const body = Buffer.from(padded, 'utf8');
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + body.length, 8);
  header.writeUInt32LE(body.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([header, body]);
};

describe('readGlbNodeNames', () => {
  it('TC-731 đọc tên node từ chunk JSON của GLB, bỏ node không tên', () => {
    const glb = glbWith({
      asset: { version: '2.0' },
      nodes: [{ name: 'body' }, {}, { name: 'region__knee__left' }],
    });
    expect(readGlbNodeNames(glb)).toEqual(['body', 'region__knee__left']);
  });

  it('TC-731 GLB không có node trả mảng rỗng', () => {
    expect(readGlbNodeNames(glbWith({ asset: { version: '2.0' } }))).toEqual([]);
  });

  it('báo lỗi khi tệp không phải GLB', () => {
    expect(() => readGlbNodeNames(Buffer.from('not a glb file at all'))).toThrow('Không phải tệp GLB');
  });
});
