const userSchema = "n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'";

export const RLS_INVENTORY_QUERIES = {
  context: `
    SELECT current_database() AS database, current_user AS reader,
      current_setting('transaction_read_only') AS read_only,
      current_setting('server_version') AS server_version`,
  roles: `
    SELECT rolname AS name, rolsuper AS superuser,
      rolbypassrls AS bypass_rls, rolcanlogin AS can_login,
      rolinherit AS inherit, rolcreaterole AS create_role,
      rolcreatedb AS create_database, rolreplication AS replication
    FROM pg_roles ORDER BY rolname`,
  memberships: `
    SELECT parent.rolname AS role, member.rolname AS member,
      grantor.rolname AS grantor, m.admin_option,
      m.inherit_option, m.set_option
    FROM pg_auth_members m
    JOIN pg_roles parent ON parent.oid = m.roleid
    JOIN pg_roles member ON member.oid = m.member
    JOIN pg_roles grantor ON grantor.oid = m.grantor
    ORDER BY parent.rolname, member.rolname, grantor.rolname`,
  schemas: `
    SELECT n.nspname AS schema, pg_get_userbyid(n.nspowner) AS owner,
      COALESCE(n.nspacl, acldefault('n', n.nspowner))::text AS acl
    FROM pg_namespace n WHERE ${userSchema}
    ORDER BY n.nspname`,
  relations: `
    SELECT n.nspname AS schema, c.relname AS name, c.relkind AS kind,
      pg_get_userbyid(c.relowner) AS owner,
      c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls,
      COALESCE(c.relacl, acldefault(
        CASE WHEN c.relkind = 'S' THEN 'S'::"char" ELSE 'r'::"char" END,
        c.relowner
      ))::text AS acl
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE ${userSchema} AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
    ORDER BY n.nspname, c.relname`,
  columnPrivileges: `
    SELECT n.nspname AS schema, c.relname AS relation,
      a.attname AS column, a.attacl::text AS acl
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE ${userSchema} AND a.attnum > 0
      AND NOT a.attisdropped AND a.attacl IS NOT NULL
    ORDER BY n.nspname, c.relname, a.attnum`,
  policies: `
    SELECT schemaname AS schema, tablename AS relation,
      policyname AS name, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname !~ '^pg_' AND schemaname <> 'information_schema'
    ORDER BY schemaname, tablename, policyname`,
  routines: `
    SELECT n.nspname AS schema, p.proname AS name,
      pg_get_function_identity_arguments(p.oid) AS arguments,
      pg_get_function_result(p.oid) AS result,
      pg_get_userbyid(p.proowner) AS owner,
      p.prosecdef AS security_definer,
      (SELECT setting FROM unnest(p.proconfig) AS setting
        WHERE setting LIKE 'search_path=%') AS search_path,
      COALESCE(p.proacl, acldefault('f', p.proowner))::text AS acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE ${userSchema}
    ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)`,
  defaultPrivileges: `
    SELECT pg_get_userbyid(d.defaclrole) AS owner,
      COALESCE(n.nspname, '*') AS schema,
      d.defaclobjtype AS kind, d.defaclacl::text AS acl
    FROM pg_default_acl d
    LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
    ORDER BY owner, schema, kind`,
} as const;
