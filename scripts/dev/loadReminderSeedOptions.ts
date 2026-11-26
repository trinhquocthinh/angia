export function loadReminderSeedOptions(env: NodeJS.ProcessEnv, usernames: string[]) {
  let connection: URL;
  try {
    connection = new URL(env.DATABASE_URL ?? '');
  } catch {
    throw new Error('Seed chỉ chạy với angia_dev_app trên angia_dev.');
  }
  if (
    env.NODE_ENV === 'production' ||
    connection.pathname !== '/angia_dev' ||
    connection.username !== 'angia_dev_app'
  ) {
    throw new Error('Seed chỉ chạy với angia_dev_app trên angia_dev.');
  }
  if (!usernames.length || usernames.some((name) => !/^[a-z0-9._-]{3,32}$/.test(name))) {
    throw new Error('Cần tên đăng nhập tài khoản main.');
  }
  return { connectionString: env.DATABASE_URL!, usernames: [...new Set(usernames)] };
}
