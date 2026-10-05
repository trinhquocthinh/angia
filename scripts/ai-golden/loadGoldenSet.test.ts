import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadGoldenSet } from './loadGoldenSet.js';

const reading = {
  type: 'device_reading',
  measuredAt: null,
  measuredTime: null,
  kind: 'glucose',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue: 6.4,
  glucoseUnit: 'mmol/L',
};

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'ai-golden-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadGoldenSet', () => {
  it('ghép ảnh với đáp án cùng tên, sắp theo mã ảnh', async () => {
    await writeFile(join(dir, 'may-do-02.png'), 'png');
    await writeFile(join(dir, 'may-do-02.expected.json'), JSON.stringify(reading));
    await writeFile(join(dir, 'may-do-01.jpg'), 'jpg');
    await writeFile(join(dir, 'may-do-01.expected.json'), JSON.stringify(reading));

    const cases = await loadGoldenSet(dir);

    expect(cases.map((golden) => [golden.caseId, golden.mimeType])).toEqual([
      ['may-do-01', 'image/jpeg'],
      ['may-do-02', 'image/png'],
    ]);
    expect(cases[0]?.imagePath).toBe(join(dir, 'may-do-01.jpg'));
    expect(cases[0]?.expected).toEqual(reading);
  });

  it('báo lỗi khi đáp án không có ảnh đi kèm', async () => {
    await writeFile(join(dir, 'may-do-01.expected.json'), JSON.stringify(reading));
    await expect(loadGoldenSet(dir)).rejects.toThrow('may-do-01: thiếu ảnh');
  });

  it('báo lỗi khi đáp án sai schema SDD §2.1', async () => {
    await writeFile(join(dir, 'may-do-01.jpg'), 'jpg');
    await writeFile(join(dir, 'may-do-01.expected.json'), JSON.stringify({ ...reading, kind: 'spo2' }));
    await expect(loadGoldenSet(dir)).rejects.toThrow('may-do-01: đáp án sai schema');
  });

  it('báo lỗi liệt kê ảnh chưa có đáp án thay vì lặng lẽ bỏ qua', async () => {
    await writeFile(join(dir, 'don-thuoc-1.jpg'), 'a');
    await writeFile(join(dir, 'don-thuoc-2.png'), 'b');
    await expect(loadGoldenSet(dir)).rejects.toThrow(
      'Ảnh chưa có đáp án *.expected.json: don-thuoc-1.jpg, don-thuoc-2.png',
    );
  });

  it('báo lỗi khi hai ảnh trùng nội dung, tránh chấm một chứng từ hai lần', async () => {
    for (const caseId of ['may-do-01', 'may-do-02']) {
      await writeFile(join(dir, `${caseId}.jpg`), 'cùng-nội-dung');
      await writeFile(join(dir, `${caseId}.expected.json`), JSON.stringify(reading));
    }
    await expect(loadGoldenSet(dir)).rejects.toThrow('Ảnh trùng nội dung: may-do-01.jpg = may-do-02.jpg');
  });
});
