import { sql, type SQL } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Bộ chuyển `executeSql` của pg-boss sang transaction drizzle để job ghi cùng transaction nghiệp vụ.
// pg-boss dùng tham số $n; mỗi $n đổi thành sql.param để drizzle đánh số lại và không bung mảng.
export function toPgBossDb(tx: FamilyScopedTx) {
  return {
    executeSql: async (text: string, values: unknown[] = []) => {
      const parts = text.split(/\$(\d+)/);
      const chunks: SQL[] = parts.map((part, index) =>
        index % 2 === 0 ? sql.raw(part) : sql`${sql.param(values[Number(part) - 1])}`,
      );
      const result = await tx.execute(sql.join(chunks));
      return { rows: result.rows };
    },
  };
}
