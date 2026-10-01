export type SystemHealth = {
  status: 'ok' | 'degraded';
  db: 'ok' | 'down';
  storage: 'ok' | 'down';
};
