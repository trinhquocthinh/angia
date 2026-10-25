import { useMutation, useQuery } from '@tanstack/react-query';
import type { PushApi } from './ports';
export function usePushSettings(api: PushApi, csrf: string) {
  const config = useQuery({
    queryKey: ['push-config', csrf],
    queryFn: ({ signal }) => api.config(signal),
    retry: false,
  });
  const action = useMutation({
    mutationFn: async ({ task, success }: { task: Promise<void>; success: string }) => {
      await task;
      return success;
    },
    onSuccess: async () => {
      await config.refetch();
    },
  });
  return { config, action };
}
