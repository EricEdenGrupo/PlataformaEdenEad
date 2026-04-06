-- PostgREST usa os roles `anon` e `authenticated` (e o client usa JWT).
-- Expor o schema no Dashboard não concede USAGE nem DML — sem isto ocorre:
--   42501 permission denied for schema identity
--
-- O RLS continua sendo aplicado; isto só permite que o role chegue às tabelas.

-- identity
grant usage on schema identity to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema identity to anon, authenticated, service_role;
grant usage, select on all sequences in schema identity to anon, authenticated, service_role;
alter default privileges in schema identity grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema identity grant usage, select on sequences to anon, authenticated, service_role;

-- catalog
grant usage on schema catalog to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema catalog to anon, authenticated, service_role;
grant usage, select on all sequences in schema catalog to anon, authenticated, service_role;
alter default privileges in schema catalog grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema catalog grant usage, select on sequences to anon, authenticated, service_role;

-- learning
grant usage on schema learning to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema learning to anon, authenticated, service_role;
grant usage, select on all sequences in schema learning to anon, authenticated, service_role;
alter default privileges in schema learning grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema learning grant usage, select on sequences to anon, authenticated, service_role;

-- notification
grant usage on schema notification to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema notification to anon, authenticated, service_role;
grant usage, select on all sequences in schema notification to anon, authenticated, service_role;
alter default privileges in schema notification grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema notification grant usage, select on sequences to anon, authenticated, service_role;

-- marketing
grant usage on schema marketing to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema marketing to anon, authenticated, service_role;
grant usage, select on all sequences in schema marketing to anon, authenticated, service_role;
alter default privileges in schema marketing grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema marketing grant usage, select on sequences to anon, authenticated, service_role;

-- Tipos enum em public referenciados pelas colunas expostas
grant usage on type public.company_segment to anon, authenticated, service_role;
grant usage on type public.company_size to anon, authenticated, service_role;
grant usage on type public.notification_type to anon, authenticated, service_role;
grant usage on type public.banner_placement to anon, authenticated, service_role;
grant usage on type public.content_status to anon, authenticated, service_role;
grant usage on type public.material_type to anon, authenticated, service_role;

-- Políticas RLS chamam esta função; o role precisa de EXECUTE
grant execute on function public.is_admin() to anon, authenticated, service_role;
