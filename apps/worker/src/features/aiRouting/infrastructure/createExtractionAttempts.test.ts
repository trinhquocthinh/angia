import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS, type AiRoutingView } from '@angia/contracts';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { createExtractionAttempts, type RoutingRuntime } from './createExtractionAttempts.js';

const view = (): AiRoutingView => ({
  version: 1,
  settings: structuredClone(DEFAULT_AI_ROUTING_SETTINGS),
  updatedAt: null,
  updatedBy: null,
});
const runtime: RoutingRuntime = {
  runMode: 'live',
  openRouterBaseUrl: 'https://openrouter.test/api/v1',
  openRouterApiKey: 'synthetic-key',
  observeCharge: async () => {},
};
const memory = () => createMemoryExtractionDeps({ result: { ok: false, reason: 'invalid_json' } });
const image = { bytes: new Uint8Array([1, 2]), mimeType: 'image/jpeg' };
const completion = () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: '{}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 1, cost: 0.001 },
    }),
  );

describe('SPEC-041: chuẩn bị adapter theo snapshot', () => {
  it('TC-519: fake chọn Woku vẫn dùng fake, không cần tỷ lệ/key và không gọi mạng', async () => {
    const network = vi.fn<typeof fetch>();
    const attempt = await createExtractionAttempts(
      memory().deps,
      { read: async () => view() },
      { ...runtime, runMode: 'fake', openRouterApiKey: undefined },
      network,
    ).prepare();
    expect(attempt.snapshot).toMatchObject({ provider: 'woku', runMode: 'fake' });
    expect(await attempt.dependencies.extractor.extract(image)).toMatchObject({
      provider: 'fake',
      costUsd: 0,
    });
    expect(network).not.toHaveBeenCalled();
  });

  it('TC-520: Woku live vẫn bị chặn trước mọi tác động OCR', async () => {
    const config = view();
    const fixture = memory();
    const network = vi.fn<typeof fetch>();
    await expect(
      createExtractionAttempts(fixture.deps, { read: async () => config }, runtime, network).prepare(),
    ).rejects.toMatchObject({ code: 'woku_live_unavailable' });
    expect(fixture.statusHistory).toEqual([]);
    expect(fixture.extractorCalls).toEqual([]);
    expect(network).not.toHaveBeenCalled();
  });

  it('TC-521: OpenRouter thiếu key không giữ ngân sách hoặc tự gọi provider khác', async () => {
    const config = view();
    config.settings.selectedProvider = 'openrouter';
    await expect(
      createExtractionAttempts(
        memory().deps,
        { read: async () => config },
        { ...runtime, openRouterApiKey: '  ' },
      ).prepare(),
    ).rejects.toMatchObject({ code: 'openrouter_key_missing' });
  });

  it('TC-522: mỗi lượt đọc lại DB; thay cặp model giữa hai lượt không thay snapshot/adapter cũ', async () => {
    const config = view();
    config.settings.selectedProvider = 'openrouter';
    const bodies: Record<string, unknown>[] = [];
    const network: typeof fetch = async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return completion();
    };
    let reads = 0;
    const attempts = createExtractionAttempts(
      memory().deps,
      {
        read: async () => {
          reads++;
          return config;
        },
      },
      runtime,
      network,
    );
    const first = await attempts.prepare();
    config.version = 2;
    config.settings.openrouter = {
      primaryModel: 'moonshotai/kimi-k2.6',
      fallbackModel: 'google/gemini-3.1-flash-lite',
    };
    const second = await attempts.prepare();
    await first.dependencies.extractor.extract(image);
    await second.dependencies.extractor.extract(image);
    expect(reads).toBe(2);
    expect(first.snapshot.version).toBe(1);
    expect(second.snapshot.version).toBe(2);
    expect(bodies.map((b) => b.model)).toEqual(['google/gemini-3.1-flash-lite', 'moonshotai/kimi-k2.6']);
    expect(bodies[0]?.provider).toEqual({ data_collection: 'deny', zdr: true });
    expect(bodies[1]?.reasoning).toEqual({ enabled: false });
  });

  it('TC-523: snapshot giữ tháng khởi đầu nhưng cổng dùng đồng hồ mới sau khi chờ DB', async () => {
    const fixture = memory();
    const instant = new Date('2026-10-31T16:59:59Z');
    fixture.deps.budget.now = () => instant;
    const attempts = createExtractionAttempts(
      fixture.deps,
      {
        read: async () => {
          instant.setTime(new Date('2026-10-31T17:00:01Z').getTime());
          return view();
        },
      },
      { ...runtime, runMode: 'fake' },
    );
    const attempt = await attempts.prepare();
    expect(attempt.snapshot.month).toBe('2026-10');
    expect(attempt.dependencies.budget.now().toISOString()).toBe('2026-10-31T17:00:01.000Z');
    expect(attempt.dependencies.budget).toBe(fixture.deps.budget);
  });

  it('TC-524: DB lỗi không lộ nội dung riêng tư trong lỗi được ném cho pg-boss', async () => {
    const attempts = createExtractionAttempts(
      memory().deps,
      {
        read: async () => {
          throw new Error('SYNTHETIC_SECRET_DATABASE');
        },
      },
      runtime,
    );
    await expect(attempts.prepare()).rejects.toMatchObject({ message: 'routing_unavailable' });
  });
});

it('TC-629: key OCR chưa gắn nguồn phí An Gia bị chặn trước đọc ảnh hoặc gọi AI', async () => {
  const config = view();
  config.settings.selectedProvider = 'openrouter';
  const fixture = memory();
  const network = vi.fn<typeof fetch>();
  await expect(
    createExtractionAttempts(
      fixture.deps,
      { read: async () => config },
      { ...runtime, observeCharge: undefined },
      network,
    ).prepare(),
  ).rejects.toMatchObject({ code: 'billing_source_missing' });
  expect(network).not.toHaveBeenCalled();
  expect(fixture.statusHistory).toEqual([]);
});
