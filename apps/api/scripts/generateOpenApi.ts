import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createStubApp } from '../src/shared/test/createStubApp.js';

// Sinh OpenAPI từ route Zod; probe/auth/repository giả vì chỉ cần cấu trúc route, không gọi hạ tầng.
const app = createStubApp();

const document = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'An Gia API', version: '0.1.0' },
});

const outputPath = fileURLToPath(new URL('../../../packages/contracts/openapi.json', import.meta.url));
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Đã ghi OpenAPI vào ${outputPath}`);
