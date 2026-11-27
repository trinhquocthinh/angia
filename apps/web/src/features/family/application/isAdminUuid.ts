// Cùng định dạng UUID RFC 9562 mà API chấp nhận (gồm UUID nil/max).
export function isAdminUuid(value: string): boolean {
  return /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i.test(
    value,
  );
}
