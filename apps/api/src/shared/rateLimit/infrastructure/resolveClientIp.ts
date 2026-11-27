import { BlockList, isIP } from 'node:net';

const MAPPED_V4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

function normalizeIp(value: string | undefined): string | undefined {
  const ip = value?.trim().replace(MAPPED_V4, '$1');
  return ip && isIP(ip) ? ip : undefined;
}

function family(ip: string) {
  return isIP(ip) === 4 ? 'ipv4' : 'ipv6';
}

// Ném lỗi khi CIDR sai để cấu hình hỏng làm API không khởi động, thay vì tin nhầm.
export function parseTrustedProxyCidrs(cidrs: readonly string[]): BlockList {
  const list = new BlockList();
  for (const cidr of cidrs) {
    const match = /^([^/]+)\/(\d{1,3})$/.exec(cidr.trim());
    const ip = normalizeIp(match?.[1]);
    const prefix = Number(match?.[2]);
    if (!ip || prefix > (isIP(ip) === 4 ? 32 : 128)) throw new Error(`CIDR không hợp lệ: ${cidr}`);
    list.addSubnet(ip, prefix, family(ip));
  }
  return list;
}

// Chỉ đọc X-Forwarded-For khi kết nối đến từ proxy tin cậy; duyệt từ phải (hop do proxy ghi) sang trái.
export function resolveClientIp(
  socketAddress: string | undefined,
  forwardedFor: string | undefined,
  trusted: BlockList,
): string {
  const peer = normalizeIp(socketAddress);
  if (!peer) return 'unknown';
  const isTrusted = (ip: string) => trusted.check(ip, family(ip));
  if (!isTrusted(peer)) return peer;
  const hops = (forwardedFor ?? '').split(',').reverse();
  for (const raw of hops) {
    const hop = normalizeIp(raw);
    // Hop gần nhất không hợp lệ: không đoán, dùng IP proxy (gộp chung khoá, chặt hơn chứ không lỏng hơn).
    if (!hop) return peer;
    if (!isTrusted(hop)) return hop;
  }
  return peer;
}
