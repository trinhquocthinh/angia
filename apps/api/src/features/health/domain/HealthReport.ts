export type DependencyStatus = 'ok' | 'down';

export type HealthReport = {
  status: 'ok' | 'degraded';
  db: DependencyStatus;
  storage: DependencyStatus;
};
