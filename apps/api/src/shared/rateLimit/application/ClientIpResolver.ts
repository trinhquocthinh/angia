import type { Context } from 'hono';

export type ClientIpResolver = (c: Context) => string;
