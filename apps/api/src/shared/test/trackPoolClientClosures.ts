import type pg from 'pg';

// pool.end() có thể hoàn tất trước khi các client phát sự kiện end.
export function trackPoolClientClosures(pool: pg.Pool) {
  const clientClosures: Promise<void>[] = [];
  pool.on('connect', (client) => {
    clientClosures.push(new Promise<void>((resolve) => client.once('end', resolve)));
  });
  return () => Promise.all(clientClosures);
}
