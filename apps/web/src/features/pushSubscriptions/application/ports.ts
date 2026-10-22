interface PushConfiguration {
  enabled: boolean;
  publicKey: string | null;
  registered: boolean;
}
export interface PushApi {
  config(signal?: AbortSignal): Promise<PushConfiguration>;
  register(
    value: PushSubscriptionJSON,
    csrf: string,
    intent: 'enable' | 'sync',
    signal?: AbortSignal,
  ): Promise<void>;
  remove(csrf: string): Promise<void>;
  sendTest(csrf: string): Promise<void>;
}
