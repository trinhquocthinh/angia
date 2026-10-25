import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

export interface HeicCase {
  caseId: string;
  path: string;
  bytes: number;
}

const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);

/** Liệt kê ảnh `.heic/.heif` trong thư mục spike, sắp theo tên để báo cáo ổn định giữa các lần chạy. */
export const loadHeicSet = async (dir: string): Promise<HeicCase[]> => {
  const files = (await readdir(dir))
    .filter((file) => HEIC_EXTENSIONS.has(extname(file).toLowerCase()))
    .sort();
  if (files.length === 0) throw new Error(`${dir}: không có ảnh HEIC (.heic/.heif) nào`);

  return Promise.all(
    files.map(async (file) => {
      const path = join(dir, file);
      return { caseId: file.slice(0, -extname(file).length), path, bytes: (await stat(path)).size };
    }),
  );
};
