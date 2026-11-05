import { expect, it, vi } from 'vitest';
import { callVisionModel } from './callVisionModel.js';
const request = {
  baseUrl: 'https://example.invalid',
  apiKey: 'synthetic',
  model: 'm',
  prompt: 'p',
  image: { mimeType: 'image/png', base64: 'a' },
};
const completion = {
  id: 'gen-1',
  created: 1780000000,
  choices: [{ message: { content: 'invalid model json' } }],
  usage: { prompt_tokens: 1, completion_tokens: 1, cost: 0.003 },
};
it('TC-545: quan sát phí trước parse JSON model; lỗi ghi phí không làm hỏng kết quả OCR', async () => {
  const observeCharge = vi.fn().mockRejectedValue(new Error('secret database detail'));
  const onBillingObservationError = vi.fn();
  const result = await callVisionModel({ ...request, observeCharge, onBillingObservationError }, async () =>
    Response.json(completion),
  );
  expect(result.content).toBe('invalid model json');
  expect(observeCharge).toHaveBeenCalledWith({
    externalId: 'gen-1',
    chargedAt: new Date(1780000000000),
    counterAmount: '0.003',
    unitDivisor: '1',
  });
  expect(onBillingObservationError).toHaveBeenCalledWith('billing_observer_failed');
});
it('TC-545: thiếu metadata không tự tạo biên lai và không đổi đầu ra cũ', async () => {
  const observeCharge = vi.fn();
  await callVisionModel({ ...request, observeCharge }, async () =>
    Response.json({ ...completion, id: undefined }),
  );
  expect(observeCharge).not.toHaveBeenCalled();
});

it('TC-545: metadata phí được ghi dù envelope/model lỗi; logger lỗi không gây retry OCR', async () => {
  const observeCharge = vi.fn();
  await expect(
    callVisionModel({ ...request, observeCharge }, async () => Response.json({ ...completion, choices: [] })),
  ).rejects.toThrow();
  expect(observeCharge).toHaveBeenCalledOnce();
  await expect(
    callVisionModel(
      {
        ...request,
        observeCharge: async () => {
          throw new Error();
        },
        onBillingObservationError: () => {
          throw new Error();
        },
      },
      async () => Response.json(completion),
    ),
  ).resolves.toMatchObject({ content: completion.choices[0]!.message.content });
});
