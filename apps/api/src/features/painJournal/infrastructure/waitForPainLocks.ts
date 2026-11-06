import type pg from 'pg';

export async function waitForPainLocks(owner: pg.Pool, count: number) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const result = await owner.query(
      "SELECT count(*) FROM pg_stat_activity WHERE usename='angia_test_app' AND wait_event_type='Lock'",
    );
    if (Number(result.rows[0].count) === count) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Không thấy ${count} transaction chờ khóa vấn đề`);
}
