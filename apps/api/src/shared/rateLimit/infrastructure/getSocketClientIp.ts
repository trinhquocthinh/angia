import { getConnInfo } from '@hono/node-server/conninfo';
import type { ClientIpResolver } from '../application/ClientIpResolver.js';

// shortcut: sau Caddy mọi client chung một IP; dùng header Caddy + TRUSTED_PROXY_CIDRS ở E31-S3-T1.
export const getSocketClientIp: ClientIpResolver = (c) => getConnInfo(c).remote.address ?? 'unknown';
