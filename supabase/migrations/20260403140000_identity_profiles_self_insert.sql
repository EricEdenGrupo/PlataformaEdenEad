-- Permitir que o próprio usuário crie a linha em identity.profiles quando o trigger
-- não rodou (ex.: usuário criado antes da migração) ou falhou. O app faz upsert após login.
create policy profiles_insert_own on identity.profiles
  for insert with check (id = auth.uid());
