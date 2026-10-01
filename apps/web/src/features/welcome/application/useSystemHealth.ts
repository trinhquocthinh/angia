import { useQuery } from '@tanstack/react-query';
import type { SystemHealth } from '../domain/SystemHealth';

// Port: adapter HTTP do page container tiêm vào để application không phụ thuộc infrastructure.
export type FetchSystemHealth = () => Promise<SystemHealth>;

export function useSystemHealth(fetchSystemHealth: FetchSystemHealth) {
  return useQuery({ queryKey: ['system-health'], queryFn: fetchSystemHealth, retry: false });
}
