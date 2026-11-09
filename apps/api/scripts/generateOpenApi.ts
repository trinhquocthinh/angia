import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createStubApp } from '../src/shared/test/createStubApp.js';

// Sinh OpenAPI từ route Zod; probe/auth/repository giả vì chỉ cần cấu trúc route, không gọi hạ tầng.
const app = createStubApp();

const document = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'An Gia API', version: '0.1.0' },
});

// Middleware áp dụng trước mọi validator JSON; khai báo cùng lỗi 413 trên hợp đồng sinh ra.
for (const path of Object.values(document.paths ?? {})) {
  for (const method of ['post', 'put', 'patch', 'delete'] as const) {
    const operation = path[method];
    const body = operation?.requestBody;
    if (!operation || !body || !('content' in body) || !body.content['application/json']) continue;
    operation.responses ??= {};
    operation.responses['413'] = {
      description: 'ERR_REQUEST_TOO_LARGE: body vượt quá 1 MiB',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    };
  }
}

const outputPath = fileURLToPath(new URL('../../../packages/contracts/openapi.json', import.meta.url));
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Đã ghi OpenAPI vào ${outputPath}`);
