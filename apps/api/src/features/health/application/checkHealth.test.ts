import { describe, expect, it } from 'vitest';
import { checkHealth } from './checkHealth.js';

const alive = () => Promise.resolve();
const dead = () => Promise.reject(new Error('connection refused'));
const hanging = () => new Promise<void>(() => {});

describe('checkHealth', () => {
  it('trả về ok khi DB và storage đều phản hồi', async () => {
    const report = await checkHealth({ db: alive, storage: alive });
    expect(report).toEqual({ status: 'ok', db: 'ok', storage: 'ok' });
  });

  it('đánh dấu db down và degraded khi DB lỗi', async () => {
    const report = await checkHealth({ db: dead, storage: alive });
    expect(report).toEqual({ status: 'degraded', db: 'down', storage: 'ok' });
  });

  it('đánh dấu storage down khi bucket không truy cập được', async () => {
    const report = await checkHealth({ db: alive, storage: dead });
    expect(report).toEqual({ status: 'degraded', db: 'ok', storage: 'down' });
  });

  it('coi probe treo quá thời gian chờ là down', async () => {
    const report = await checkHealth({ db: hanging, storage: alive }, { timeoutMs: 20 });
    expect(report.db).toBe('down');
  });
});
