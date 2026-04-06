-- Inclui telefone do perfil a partir dos metadados do signUp quando o trigger cria a linha
-- (útil quando a confirmação por email impede sessão imediata e o app não faz upsert no cliente).
create or replace function identity.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into identity.profiles (id, email, first_name, last_name, avatar_url, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'family_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    nullif(btrim(new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
