-- Tar bort profiles och kopplar allt direkt till auth.users.
-- Namnet flyttar till household_members (ett namn per hushåll) och temat
-- sparas bara i telefonen.
--
-- Alla tabeller får created_at, updated_at och deleted_at:
--   joined_at -> created_at, left_at -> deleted_at, done_at -> created_at.
-- Inget raderas längre på riktigt från appen. Att ta bort något betyder att
-- deleted_at sätts. Reglerna döljer inte borttagna rader, eftersom Postgres
-- då inte låter en uppdatering sätta deleted_at. Appen filtrerar själv:
--   supabase.from("chores").select("*").is("deleted_at", null)
-- Vyn chores_with_last_done och household_stats filtrerar redan.


-- ============================================================
-- Ta bort det som byggde på den gamla strukturen
-- ============================================================

do $$
declare
  p record;
begin
  for p in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

drop trigger on_auth_user_created on auth.users;
drop function public.handle_new_user();
drop function public.shares_household(uuid);
drop view public.chores_with_last_done;
drop function public.household_stats(uuid, date, date);


-- ============================================================
-- Tabeller
-- ============================================================

-- household_members: koppla till auth.users, flytta in namnet.
alter table public.household_members rename column profile_id to user_id;
alter table public.household_members rename column joined_at to created_at;
alter table public.household_members rename column left_at to deleted_at;
alter table public.household_members add column name varchar(100) not null default '';
alter table public.household_members add column updated_at timestamptz not null default now();

update public.household_members m
set name = p.name
from public.profiles p
where p.id = m.user_id;

alter table public.household_members drop constraint household_members_profile_id_fkey;
alter table public.household_members
  add foreign key (user_id) references auth.users (id) on delete cascade;

-- pauses: start_date och end_date beskriver själva pausen och ligger kvar.
alter table public.pauses rename column profile_id to user_id;
alter table public.pauses add column created_at timestamptz not null default now();
alter table public.pauses add column updated_at timestamptz not null default now();
alter table public.pauses add column deleted_at timestamptz;

-- chore_assignments: får ett eget id, så att en syssla kan tilldelas samma
-- person igen efter att en tidigare tilldelning tagits bort.
alter table public.chore_assignments rename column profile_id to user_id;
alter table public.chore_assignments drop constraint chore_assignments_profile_id_fkey;
alter table public.chore_assignments
  add foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.chore_assignments drop constraint chore_assignments_pkey;
alter table public.chore_assignments add column id uuid not null default gen_random_uuid() primary key;
alter table public.chore_assignments add column created_at timestamptz not null default now();
alter table public.chore_assignments add column updated_at timestamptz not null default now();
alter table public.chore_assignments add column deleted_at timestamptz;
create unique index chore_assignments_active_key
  on public.chore_assignments (user_id, chore_id)
  where deleted_at is null;
create index on public.chore_assignments (user_id);

-- completions: created_at är när sysslan markerades som gjord.
alter table public.completions rename column profile_id to user_id;
alter table public.completions rename column done_at to created_at;
alter table public.completions drop constraint completions_profile_id_fkey;
alter table public.completions
  add foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.completions add column updated_at timestamptz not null default now();
alter table public.completions add column deleted_at timestamptz;

alter table public.chores add column updated_at timestamptz not null default now();
alter table public.chores add column deleted_at timestamptz;

alter table public.chore_groups add column created_at timestamptz not null default now();
alter table public.chore_groups add column updated_at timestamptz not null default now();
alter table public.chore_groups add column deleted_at timestamptz;

alter table public.households add column updated_at timestamptz not null default now();
alter table public.households add column deleted_at timestamptz;

alter table public.avatars add column created_at timestamptz not null default now();
alter table public.avatars add column updated_at timestamptz not null default now();
alter table public.avatars add column deleted_at timestamptz;

drop table public.profiles;

-- Namnen på index och nycklar följer med kolumnbytet.
alter index public.pauses_household_id_profile_id_idx rename to pauses_household_id_user_id_idx;
alter index public.completions_profile_id_idx rename to completions_user_id_idx;
alter index public.completions_chore_id_done_at_idx rename to completions_chore_id_created_at_idx;
alter table public.pauses
  rename constraint pauses_profile_id_household_id_fkey to pauses_user_id_household_id_fkey;


-- ============================================================
-- created_at och updated_at sköts av databasen
-- ============================================================
-- updated_at sätts vid varje ändring. Appen kan inte ändra created_at, så
-- ingen kan t.ex. flytta en gjord syssla bakåt i tiden i statistiken.
-- Funktionerna nedan (join_household m.fl.) körs som en annan roll och får
-- sätta created_at, t.ex. när någon går med i ett hushåll igen.
create function public.set_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if current_user = 'authenticated' then
      new.created_at := now();
    end if;
  elsif current_user = 'authenticated' then
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'avatars', 'households', 'household_members', 'pauses',
    'chore_groups', 'chores', 'chore_assignments', 'completions'
  ] loop
    execute format(
      'create trigger set_timestamps before insert or update on public.%I
       for each row execute function public.set_timestamps()', t);
  end loop;
end;
$$;


-- ============================================================
-- Rättigheter
-- ============================================================

-- Inget raderas från appen, bara deleted_at sätts.
revoke delete on all tables in schema public from anon, authenticated;

-- En gjord syssla kan bara ångras (deleted_at), inte ändras.
revoke update on public.completions from anon, authenticated;
grant update (deleted_at) on public.completions to authenticated;

revoke execute on function public.set_timestamps() from public, anon, authenticated;


-- ============================================================
-- Hjälpfunktioner för reglerna
-- ============================================================
-- Ett hushåll eller ett medlemskap med deleted_at räknas som borta.

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
      and m.is_approved
      and m.deleted_at is null
      and h.deleted_at is null
  );
$$;

create or replace function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
      and m.is_owner
      and m.is_approved
      and m.deleted_at is null
      and h.deleted_at is null
  );
$$;

create or replace function public.has_membership(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    join public.households h on h.id = m.household_id
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
      and m.deleted_at is null
      and h.deleted_at is null
  );
$$;

-- En borttagen syssla hör inte längre till något hushåll, så den kan inte
-- markeras som gjord eller tilldelas.
create or replace function public.chore_household_id(p_chore_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.chores where id = p_chore_id and deleted_at is null;
$$;


-- ============================================================
-- Regler (Row Level Security)
-- ============================================================

create policy "Läsa avatarer" on public.avatars
  for select to authenticated
  using (true);

-- households
create policy "Se egna hushåll" on public.households
  for select to authenticated
  using (public.has_membership(id));

create policy "Ägare ändrar hushållet" on public.households
  for update to authenticated
  using (public.is_household_owner(id))
  with check (public.is_household_owner(id));

-- household_members: även de som har lämnat syns, så att statistiken kan
-- visa deras namn och avatar. Filtrera med deleted_at för nuvarande medlemmar.
create policy "Se hushållets medlemmar" on public.household_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_membership(household_id));

-- Man ändrar sitt namn, sin avatar och kan lämna (deleted_at). Ägare kan
-- ändra allt, t.ex. godkänna eller neka (deleted_at) en förfrågan.
-- Triggern guard_member_update stoppar resten.
create policy "Ändra egen rad eller som ägare" on public.household_members
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_household_owner(household_id))
  with check (user_id = (select auth.uid()) or public.is_household_owner(household_id));

-- pauses
create policy "Se pauser" on public.pauses
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "Ägare lägger till pauser" on public.pauses
  for insert to authenticated
  with check (public.is_household_owner(household_id));

create policy "Ägare ändrar pauser" on public.pauses
  for update to authenticated
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

-- chore_groups
create policy "Se grupper" on public.chore_groups
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "Ägare lägger till grupper" on public.chore_groups
  for insert to authenticated
  with check (public.is_household_owner(household_id));

create policy "Ägare ändrar grupper" on public.chore_groups
  for update to authenticated
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

-- chores
create policy "Se sysslor" on public.chores
  for select to authenticated
  using (public.is_household_member(household_id));

create policy "Ägare lägger till sysslor" on public.chores
  for insert to authenticated
  with check (public.is_household_owner(household_id));

create policy "Ägare ändrar sysslor" on public.chores
  for update to authenticated
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

-- chore_assignments
create policy "Se tilldelningar" on public.chore_assignments
  for select to authenticated
  using (public.is_household_member(public.chore_household_id(chore_id)));

create policy "Ägare tilldelar sysslor" on public.chore_assignments
  for insert to authenticated
  with check (public.is_household_owner(public.chore_household_id(chore_id)));

create policy "Ägare ändrar tilldelningar" on public.chore_assignments
  for update to authenticated
  using (public.is_household_owner(public.chore_household_id(chore_id)))
  with check (public.is_household_owner(public.chore_household_id(chore_id)));

-- completions
create policy "Se gjorda sysslor" on public.completions
  for select to authenticated
  using (public.is_household_member(public.chore_household_id(chore_id)));

create policy "Markera syssla som gjord" on public.completions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_household_member(public.chore_household_id(chore_id))
  );

-- Ångra en markering (sätt deleted_at): sin egen, eller vilken som helst om man är ägare.
create policy "Ångra gjord syssla" on public.completions
  for update to authenticated
  using (
    (user_id = (select auth.uid()) and public.is_household_member(public.chore_household_id(chore_id)))
    or public.is_household_owner(public.chore_household_id(chore_id))
  )
  with check (
    (user_id = (select auth.uid()) and public.is_household_member(public.chore_household_id(chore_id)))
    or public.is_household_owner(public.chore_household_id(chore_id))
  );


-- ============================================================
-- Triggers och funktioner som appen anropar
-- ============================================================

-- En vanlig medlem får bara ändra namn och avatar och lämna (sätta deleted_at)
-- på sin egen rad.
create or replace function public.guard_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or public.is_household_owner(old.household_id) then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.household_id is distinct from old.household_id
    or new.is_owner is distinct from old.is_owner
    or new.is_approved is distinct from old.is_approved
    or new.created_at is distinct from old.created_at
    -- Den som har lämnat måste gå med igen via join_household().
    or (old.deleted_at is not null and new.deleted_at is null)
  then
    raise exception 'Bara en ägare kan ändra det här';
  end if;

  return new;
end;
$$;

-- Skapar ett hushåll med en kod och gör den inloggade till ägare. Namnet i
-- hushållet hämtas från registreringen och kan ändras efteråt:
-- supabase.auth.signUp({ email, password, options: { data: { name } } })
-- supabase.rpc("create_household", { p_name: "Familjen" })
create or replace function public.create_household(p_name text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household public.households;
begin
  if (select auth.uid()) is null then
    raise exception 'Du måste vara inloggad';
  end if;

  insert into public.households (name, code)
  values (trim(p_name), public.generate_household_code())
  returning * into new_household;

  insert into public.household_members (user_id, household_id, name, is_owner, is_approved)
  values (
    (select auth.uid()),
    new_household.id,
    coalesce((select raw_user_meta_data ->> 'name' from auth.users where id = (select auth.uid())), ''),
    true,
    true
  );

  return new_household;
end;
$$;

-- Skickar en förfrågan om att gå med i hushållet med koden. En ägare
-- godkänner (is_approved = true) eller nekar (deleted_at = now()).
-- supabase.rpc("join_household", { p_code: "AB12CD" })
create or replace function public.join_household(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_household_id uuid;
  existing public.household_members;
begin
  if (select auth.uid()) is null then
    raise exception 'Du måste vara inloggad';
  end if;

  select id into found_household_id
  from public.households
  where code = upper(trim(p_code)) and deleted_at is null;

  if found_household_id is null then
    raise exception 'Det finns inget hushåll med koden %', p_code;
  end if;

  select * into existing
  from public.household_members
  where household_id = found_household_id and user_id = (select auth.uid());

  if existing.user_id is not null and existing.deleted_at is null then
    raise exception 'Du är redan med i hushållet eller väntar på svar';
  end if;

  if existing.user_id is not null then
    -- Har lämnat eller blivit nekad tidigare: gör om raden till en ny förfrågan.
    update public.household_members
    set deleted_at = null, is_approved = false, is_owner = false, created_at = now()
    where household_id = found_household_id and user_id = (select auth.uid());
  else
    insert into public.household_members (user_id, household_id, name)
    values (
      (select auth.uid()),
      found_household_id,
      coalesce((select raw_user_meta_data ->> 'name' from auth.users where id = (select auth.uid())), '')
    );
  end if;

  return found_household_id;
end;
$$;


-- ============================================================
-- Statistik
-- ============================================================

-- Sysslorna som inte är borttagna, med när de senast gjordes.
-- supabase.from("chores_with_last_done").select("*").eq("household_id", id)
create view public.chores_with_last_done
with (security_invoker = true)
as
select
  c.*,
  (
    select max(created_at) from public.completions
    where chore_id = c.id and deleted_at is null
  ) as last_done_at
from public.chores c
where c.deleted_at is null;

grant select on public.chores_with_last_done to authenticated;

-- Statistik för ett hushåll mellan två datum (p_to räknas inte med).
-- En rad per medlem och syssla:
--   completions        antal gånger sysslan gjordes
--   points             summan av vikterna
--   active_days        dagar i perioden då medlemmen inte var pausad
--   normalized_points  points uppskalat till hela perioden, så att den som
--                      varit pausad halva perioden inte ser ut att ha gjort hälften
-- Borttagna sysslor, ångrade markeringar och borttagna pauser räknas inte.
-- Arkiverade sysslor räknas. Datum räknas i svensk tid.
-- supabase.rpc("household_stats", { p_household_id, p_from: "2026-10-12", p_to: "2026-10-19" })
create function public.household_stats(p_household_id uuid, p_from date, p_to date)
returns table (
  user_id uuid,
  chore_id uuid,
  completions integer,
  points integer,
  active_days integer,
  normalized_points numeric
)
language sql
stable
set search_path = ''
as $$
  with days as (
    select d::date as day
    from generate_series(p_from, p_to - 1, interval '1 day') as d
  ),
  paused_days as (
    select distinct p.user_id, days.day
    from public.pauses p
    join days on days.day >= p.start_date and (p.end_date is null or days.day <= p.end_date)
    where p.household_id = p_household_id
      and p.deleted_at is null
  ),
  active as (
    select m.user_id, count(days.day)::int as active_days
    from public.household_members m
    cross join days
    where m.household_id = p_household_id
      and not exists (
        select 1 from paused_days pd
        where pd.user_id = m.user_id and pd.day = days.day
      )
    group by m.user_id
  ),
  done as (
    select
      c.user_id,
      c.chore_id,
      count(*)::int as completions,
      sum(ch.weight)::int as points
    from public.completions c
    join public.chores ch on ch.id = c.chore_id
    where ch.household_id = p_household_id
      and ch.deleted_at is null
      and c.deleted_at is null
      and (c.created_at at time zone 'Europe/Stockholm')::date >= p_from
      and (c.created_at at time zone 'Europe/Stockholm')::date < p_to
      and not exists (
        select 1 from paused_days pd
        where pd.user_id = c.user_id
          and pd.day = (c.created_at at time zone 'Europe/Stockholm')::date
      )
    group by c.user_id, c.chore_id
  )
  select
    done.user_id,
    done.chore_id,
    done.completions,
    done.points,
    coalesce(active.active_days, 0),
    case
      when coalesce(active.active_days, 0) = 0 then null
      else round(done.points * (p_to - p_from)::numeric / active.active_days, 2)
    end
  from done
  left join active on active.user_id = done.user_id
  where public.is_household_member(p_household_id);
$$;

revoke execute on function public.household_stats(uuid, date, date) from public, anon;
grant execute on function public.household_stats(uuid, date, date) to authenticated;
