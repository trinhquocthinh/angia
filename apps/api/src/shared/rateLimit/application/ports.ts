import type { RateLimitPolicy } from '../domain/RateLimitPolicy.js';

export type RateLimitKey = string | { ip: string; username: string };
export type KeyHasher = (kind: RateLimitPolicy['kind'], key: RateLimitKey) => string;
export interface RateLimitStore {
  increment(keyHash: string, windowStart: number): Promise<number>;
  read(keyHash: string, windowStart: number): Promise<number>;
}
export type RateLimitDependencies = {
  store: RateLimitStore;
  keyHasher: KeyHasher;
  now(): number;
};
