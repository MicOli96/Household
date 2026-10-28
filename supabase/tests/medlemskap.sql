-- Kontrollerar reglerna för household_members. Allt körs i en transaktion
-- som rullas tillbaka, så databasen ändras inte. Mot en lokal Supabase:
--   npx supabase db reset
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/medlemskap.sql
-- Skriptet avbryts med ett fel om någon kontroll misslyckas och skriver
-- "Alla kontroller gick igenom" annars.

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '{"name": "Ägaren"}'),
  ('00000000-0000-0000-0000-00000000000b', '{"name": "Medlemmen"}'),
  ('00000000-0000-0000-0000-00000000000c', '{"name": "Angriparen"}'),
  ('00000000-0000-0000-0000-00000000000d', '{"name": "Nekad"}');

set local role authenticated;

create temporary table ids (name text primary key, id uuid, code text) on commit drop;
grant all on ids to authenticated;

-- Ägaren skapar ett hushåll.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
insert into ids select 'offer', id, code from public.create_household('Offrets hushåll');

-- Medlemmen går med med koden och blir godkänd av ägaren.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
select public.join_household((select code from ids where name = 'offer'));
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$
begin
  update public.household_members set is_approved = true
  where household_id = (select id from ids where name = 'offer')
    and user_id = '00000000-0000-0000-0000-00000000000b';
  if not found then raise exception 'Ägaren kunde inte godkänna förfrågan'; end if;
end $$;

-- Medlemmen byter namn och avatar på sin egen rad.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$
begin
  update public.household_members set name = 'Nytt namn', avatar_id = 3
  where household_id = (select id from ids where name = 'offer') and user_id = auth.uid();
  if not found then raise exception 'Medlemmen kunde inte byta namn och avatar'; end if;
end $$;

-- Medlemmen kan inte göra sig själv till ägare.
do $$
begin
  update public.household_members set is_owner = true
  where household_id = (select id from ids where name = 'offer') and user_id = auth.uid();
  raise exception 'FEL: medlemmen kunde göra sig själv till ägare';
exception when raise_exception then
  if sqlerrm like 'FEL:%' then raise; end if;
end $$;

-- Ägaren gör medlemmen till ägare och tar bort rollen igen.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$
begin
  update public.household_members set is_owner = true
  where household_id = (select id from ids where name = 'offer')
    and user_id = '00000000-0000-0000-0000-00000000000b';
  update public.household_members set is_owner = false
  where household_id = (select id from ids where name = 'offer')
    and user_id = '00000000-0000-0000-0000-00000000000b';
  if not found then raise exception 'Ägaren kunde inte ändra ägarrollen'; end if;
end $$;

-- En förfrågan nekas och personen kan fråga igen.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', true);
select public.join_household((select code from ids where name = 'offer'));
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
update public.household_members set deleted_at = now(), avatar_id = null
where household_id = (select id from ids where name = 'offer')
  and user_id = '00000000-0000-0000-0000-00000000000d' and not is_approved;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', true);
select public.join_household((select code from ids where name = 'offer'));

-- Angriparen känner bara till koden. Ett konto skickar en förfrågan och får
-- hushållets id, ett annat skapar ett eget hushåll och försöker flytta sin
-- ägarrad dit.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
insert into ids select 'eget', id, code from public.create_household('Angriparens');
do $$
begin
  update public.household_members set household_id = (select id from ids where name = 'offer')
  where household_id = (select id from ids where name = 'eget') and user_id = auth.uid();
  raise exception 'FEL: ägarraden kunde flyttas till ett annat hushåll';
exception when raise_exception then
  if sqlerrm like 'FEL:%' then raise; end if;
end $$;
do $$
begin
  if public.is_household_owner((select id from ids where name = 'offer')) then
    raise exception 'FEL: angriparen är ägare i offrets hushåll';
  end if;
end $$;

-- En ägare kan inte heller byta användare på en rad i sitt eget hushåll.
do $$
begin
  update public.household_members set user_id = '00000000-0000-0000-0000-00000000000b'
  where household_id = (select id from ids where name = 'eget') and user_id = auth.uid();
  raise exception 'FEL: en ägare kunde byta användare på en rad';
exception when raise_exception then
  if sqlerrm like 'FEL:%' then raise; end if;
end $$;

-- En medlem lämnar och går med igen.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
update public.household_members set deleted_at = now()
where household_id = (select id from ids where name = 'offer') and user_id = auth.uid();
select public.join_household((select code from ids where name = 'offer'));

select 'Alla kontroller gick igenom' as resultat;
rollback;
