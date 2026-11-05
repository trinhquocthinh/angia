import type { Pool } from 'pg';
import { expect, it } from 'vitest';
import { createPostgresProbe } from './createPostgresProbe.js';

it('hủy probe đóng client đang chạy và chỉ trả kết nối một lần', async () => {
  const controller = new AbortController();
  let closeQuery!: (error: Error) => void;
  let destroyed = false;
  let releases = 0;
  const client = {
    query: () =>
      new Promise<void>((_resolve, reject) => {
        closeQuery = reject;
      }),
    release: (destroy?: boolean) => {
      releases++;
      destroyed = Boolean(destroy);
      closeQuery(new Error('connection closed'));
    },
  };
  const pool = { connect: async () => client } as unknown as Pool;
  const pending = createPostgresProbe(pool)(controller.signal);
  await Promise.resolve();
  controller.abort();
  await expect(pending).rejects.toThrow('connection closed');
  expect(destroyed).toBe(true);
  expect(releases).toBe(1);
});

it('phiên hủy trong khi chờ lấy client không chạy query hoặc làm rò kết nối', async () => {
  const controller = new AbortController();
  let checkout!: (client: unknown) => void;
  let queries = 0;
  let releases = 0;
  const pool = {
    connect: () =>
      new Promise((resolve) => {
        checkout = resolve;
      }),
  } as unknown as Pool;
  const pending = createPostgresProbe(pool)(controller.signal);
  controller.abort();
  checkout({
    query: () => {
      queries++;
    },
    release: () => {
      releases++;
    },
  });
  await expect(pending).rejects.toThrow();
  expect(queries).toBe(0);
  expect(releases).toBe(1);
});
