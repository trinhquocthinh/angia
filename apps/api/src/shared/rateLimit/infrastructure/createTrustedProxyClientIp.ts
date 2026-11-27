import { getConnInfo } from '@hono/node-server/conninfo';
import type { ClientIpResolver } from '../application/ClientIpResolver.js';
import { parseTrustedProxyCidrs, resolveClientIp } from './resolveClientIp.js';

export function createTrustedProxyClientIp(cidrs: readonly string[]): ClientIpResolver {
  const trusted = parseTrustedProxyCidrs(cidrs);
  return (c) => resolveClientIp(getConnInfo(c).remote.address, c.req.header('x-forwarded-for'), trusted);
}
