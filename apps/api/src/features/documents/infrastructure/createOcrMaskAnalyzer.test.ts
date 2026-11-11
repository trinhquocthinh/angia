import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createOcrMaskAnalyzer } from './createOcrMaskAnalyzer.js';

type Handler = (req: IncomingMessage, body: Buffer, res: ServerResponse) => void;
let handler: Handler;
let server: Server;
let url: string;
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9]);
const signal = () => new AbortController().signal;
const json = (res: ServerResponse, status: number, body: unknown) =>
  res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));

beforeAll(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => handler(req, Buffer.concat(chunks), res));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('Adapter ocr-mask /v1/analyze (SPEC-083)', () => {
  it('TC-883: gửi multipart `image` JPEG, chỉ trả bbox của vùng mask:true, bỏ chữ OCR', async () => {
    let seen = { path: '', type: '', hasJpeg: false };
    handler = (req, body, res) => {
      seen = {
        path: req.url ?? '',
        type: req.headers['content-type'] ?? '',
        hasJpeg: body.includes(Buffer.from(jpeg)) && body.includes('name="image"'),
      };
      json(res, 200, {
        image: { width: 100, height: 100 },
        regions: [
          {
            id: 'r1',
            bbox: [0.1, 0.1, 0.3, 0.2],
            text: 'NGUYEN VAN A',
            conf: 0.9,
            mask: true,
            reason: 'nhãn PII',
          },
          { id: 'r2', bbox: [0.1, 0.5, 0.3, 0.6], text: 'Cetirizine', conf: 0.9, mask: false, reason: null },
          { id: 'c0', bbox: [0.7, 0, 0.9, 0.1], text: null, conf: null, mask: true, reason: 'mã vạch/QR' },
        ],
      });
    };
    const boxes = await createOcrMaskAnalyzer(url).analyze(jpeg, signal());
    expect(boxes).toEqual([
      [0.1, 0.1, 0.3, 0.2],
      [0.7, 0, 0.9, 0.1],
    ]);
    expect(seen).toEqual({
      path: '/v1/analyze',
      type: expect.stringMatching(/^multipart\/form-data/),
      hasJpeg: true,
    });
  });

  it('TC-888: HTTP lỗi, JSON sai schema hoặc quá timeout → ném lỗi không chứa nội dung phản hồi', async () => {
    const cases: Handler[] = [
      (_req, _body, res) => json(res, 500, { detail: 'NGUYEN VAN A' }),
      (_req, _body, res) => json(res, 200, { regions: [{ bbox: [0.1, 0.1], mask: true }] }),
      (_req, _body, res) => json(res, 200, { regions: [{ bbox: [0, 0, 2, 1], mask: true }] }),
      () => undefined, // treo, không trả lời
    ];
    for (const next of cases) {
      handler = next;
      const failure = await createOcrMaskAnalyzer(url, { timeoutMs: 200 })
        .analyze(jpeg, signal())
        .then(
          () => null,
          (error: unknown) => error,
        );
      expect(failure).toBeInstanceOf(Error);
      expect(String((failure as Error).message)).not.toContain('NGUYEN');
    }
  });
});
