import type pg from 'pg';

// Bảng có family_id mà FK từ health_profiles không cuốn theo; bảng mới phải thêm vào đây
// (familyDeletion.int.test.ts giữ danh sách kiểm kê). object_purges (hàng đợi vét), scan_quota_audit
// (nhật ký quota, D3) và admin_audit_events (BR-084) giữ lại; role xoá nhà không đụng tới hai bảng sau.
const FAMILY_TABLES = [
  'push_subscriptions',
  'removed_member_windows',
  'family_extraction_spend',
  'family_scan_quotas',
] as const;

// BR-010: xoá cứng, chạy bằng role xoá nhà. FK cascade từ health_profiles lo dữ liệu sức khỏe, ảnh, nhắc,
// giám hộ. finalize_family_deletion kiểm lại, gỡ Chủ hộ khỏi nhà rồi xoá hàng families (dòng yêu cầu đi theo cascade).
export async function deleteStoredFamily(
  client: pg.PoolClient,
  familyId: string,
  requestId: string,
): Promise<string[]> {
  const profiles = await client.query<{ id: string }>('SELECT id FROM health_profiles WHERE family_id=$1', [
    familyId,
  ]);
  // Khoá ảnh vào hàng đợi vét trước khi xoá source_documents; role chỉ INSERT nên không dùng RETURNING.
  await client.query(
    `INSERT INTO object_purges(object_key,family_id)
     SELECT DISTINCT image_key,family_id FROM source_documents WHERE family_id=$1 AND image_key IS NOT NULL
     ON CONFLICT DO NOTHING`,
    [familyId],
  );
  await client.query('DELETE FROM health_profiles WHERE family_id=$1', [familyId]);
  for (const table of FAMILY_TABLES)
    await client.query(`DELETE FROM ${table} WHERE family_id=$1`, [familyId]);
  await client.query('SELECT public.finalize_family_deletion($1)', [requestId]);
  return profiles.rows.map((row) => row.id);
}
