import { readFile } from 'node:fs/promises';
import { parseIdentityMapping } from './parseIdentityMapping.js';

export async function readIdentityMappingFile(path: string) {
  const content = await readFile(path, 'utf8');
  let input: unknown;
  try {
    input = JSON.parse(content);
  } catch {
    // SyntaxError của JSON.parse có thể kèm đoạn dữ liệu riêng tư.
    throw new Error('Tệp mapping không phải JSON hợp lệ.');
  }
  return parseIdentityMapping(input);
}
