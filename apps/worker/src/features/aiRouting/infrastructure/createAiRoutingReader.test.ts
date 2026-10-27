import type pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import { createAiRoutingReader } from './createAiRoutingReader.js';

const row = () => ({
  version: '0',
  settings: structuredClone(DEFAULT_AI_ROUTING_SETTINGS),
  updated_at: null,
  updated_by: null,
});
function reader(rows: unknown[]) {
  const query = vi.fn(async () => ({ rows }));
  return createAiRoutingReader({ query } as unknown as Pick<pg.Pool, 'query'>);
}

describe('SPEC-041: worker đọc singleton phi y tế bằng role app', () => {
  it('TC-525: đọc bootstrap và cấu hình có timestamp từ pg', async () => {
    expect(await reader([row()]).read()).toMatchObject({
      version: 0,
      updatedAt: null,
      settings: DEFAULT_AI_ROUTING_SETTINGS,
    });
    expect(
      await reader([
        {
          ...row(),
          version: '4',
          updated_at: new Date('2026-10-26T00:00:00Z'),
          updated_by: '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5b',
        },
      ]).read(),
    ).toMatchObject({ version: 4, updatedAt: '2026-10-26T00:00:00.000Z' });
  });

  it.each(
    [
      [],
      [{ ...row(), version: '9007199254740992' }],
      [{ ...row(), settings: {} }],
      [{ ...row(), updated_at: 'invalid' }],
    ].map((rows) => ({ rows })),
  )('TC-526: thiếu/sai singleton báo lỗi cấu hình, không dùng defaults ($rows)', async ({ rows }) => {
    await expect(reader(rows).read()).rejects.toMatchObject({
      code: 'routing_invalid',
      message: 'routing_invalid',
    });
  });

  it('TC-524: lỗi query được rút về mã cố định, không chứa URL/key', async () => {
    const query = async () => {
      throw new Error('postgres://SYNTHETIC_SECRET');
    };
    await expect(
      createAiRoutingReader({ query } as unknown as Pick<pg.Pool, 'query'>).read(),
    ).rejects.toMatchObject({ code: 'routing_unavailable', message: 'routing_unavailable' });
  });
});
