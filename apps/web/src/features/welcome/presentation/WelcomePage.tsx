import { useSystemHealth } from '../application/useSystemHealth';
import { fetchHealth } from '../infrastructure/fetchHealth';
import { HealthStatusCard } from './components/HealthStatusCard';

export function WelcomePage() {
  const health = useSystemHealth(fetchHealth);

  return (
    <section className="flex flex-col items-center gap-6 pt-12 text-center">
      <img src="/logo.png" alt="" width={96} height={96} className="rounded-2xl" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">An Gia</h1>
        <p className="text-text-secondary">Chăm chút từng thói quen, chở che từng thế hệ.</p>
      </div>
      <HealthStatusCard isLoading={health.isPending} isUnreachable={health.isError} health={health.data} />
    </section>
  );
}
