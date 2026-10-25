// Cổng thăm dò một phụ thuộc hạ tầng: resolve khi sống, reject khi lỗi.
export type DependencyProbe = () => Promise<void>;

export type HealthProbes = {
  db: DependencyProbe;
  storage: DependencyProbe;
};
