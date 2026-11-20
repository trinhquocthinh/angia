import type pg from 'pg';

// Migration 0046 tạo role `<owner>_family_deletion` và cho role app SET vào nó (không INHERIT).
// Suy tên từ DB thay vì thêm biến môi trường: đúng một role như vậy mà role hiện tại được SET.
export async function enterFamilyDeletionRole(client: pg.PoolClient): Promise<void> {
  const { rows } = await client.query<{ rolname: string }>(
    `SELECT r.rolname FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid
     WHERE m.member = (SELECT oid FROM pg_roles WHERE rolname = current_user)
       AND m.set_option AND r.rolname LIKE '%\\_family\\_deletion'`,
  );
  if (rows.length !== 1) throw new Error('family_deletion_role_missing');
  await client.query(`SET LOCAL ROLE ${client.escapeIdentifier(rows[0]!.rolname)}`);
}
