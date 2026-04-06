-- Ao concluir o onboarding (linha em identity.onboarding_answers),
-- marca identity.profiles.onboarding_done = true automaticamente.

create or replace function identity.set_profile_onboarding_done()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update identity.profiles
  set
    onboarding_done = true,
    updated_at = now()
  where id = new.profile_id;
  return new;
end;
$$;

drop trigger if exists trg_onboarding_answers_sets_profile_done on identity.onboarding_answers;

create trigger trg_onboarding_answers_sets_profile_done
  after insert or update on identity.onboarding_answers
  for each row
  execute function identity.set_profile_onboarding_done();

-- Perfis que já possuíam respostas antes deste trigger
update identity.profiles p
set
  onboarding_done = true,
  updated_at = now()
where
  exists (select 1 from identity.onboarding_answers o where o.profile_id = p.id)
  and (p.onboarding_done is distinct from true);
