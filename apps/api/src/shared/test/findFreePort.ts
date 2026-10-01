import { createServer } from 'node:net';

// Xin hệ điều hành một cổng TCP trống rồi trả lại ngay để test dùng.
export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        server.close();
        reject(new Error('Không xác định được cổng trống'));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}
