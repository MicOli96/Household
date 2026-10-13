-- Grundschema för Hushållet.
-- Tabeller, regler (RLS), funktioner som appen anropar med supabase.rpc(...)
-- och en bucket för bilder och ljud till sysslor.


-- ============================================================
-- Tabeller
-- ============================================================

-- En profil per inloggad användare. id är samma som i auth.users,
-- där Supabase sparar e-post och lösenord.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name varchar(100) not null default '',
  theme text not null default 'auto' check (theme in ('auto', 'light', 'dark')),
  created_at timestamptz not null default now()
);

-- Den fördefinierade listan med avatarer, samma som src/theme/avatars.ts.
create table public.avatars (
  id smallint primary key,
  emoji text not null unique,
  color text not null
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  code varchar(10) not null unique,
  created_at timestamptz not null default now()
);

-- Vem som är med i vilket hushåll. En rad med is_approved = false är en
-- förfrågan som en ägare inte har svarat på än. left_at sätts när någon
-- lämnar, raden ligger kvar så att statistiken kan visa deras avatar.
create table public.household_members (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  avatar_id smallint references public.avatars (id),
  is_owner boolean not null default false,
  is_approved boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (profile_id, household_id),
  -- Två i samma hushåll kan inte ha samma avatar.
  unique (household_id, avatar_id)
);

-- Perioder då en medlem är pausad. end_date = null betyder att pausen pågår.
create table public.pauses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  household_id uuid not null,
  start_date date not null default current_date,
  end_date date,
  foreign key (profile_id, household_id)
    references public.household_members (profile_id, household_id) on delete cascade,
  check (end_date is null or end_date >= start_date)
);

-- Grupper av sysslor som roteras mellan medlemmarna.
create table public.chore_groups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name varchar(100) not null,
  rotation_days integer not null check (rotation_days > 0),
  start_date date not null default current_date
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  chore_group_id uuid references public.chore_groups (id) on delete set null,
  name varchar(100) not null,
  description text not null default '',
  -- Hur ofta sysslan ska göras, i dagar.
  interval_days integer not null check (interval_days > 0),
  -- Hur energikrävande sysslan är.
  weight smallint not null check (weight in (1, 2, 4, 6, 8)),
  -- Sökvägar i bucketen chore-media, t.ex. "<household_id>/<chore_id>.jpg".
  image_path text,
  audio_path text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Vilka medlemmar en syssla är tilldelad.
create table public.chore_assignments (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  chore_id uuid not null references public.chores (id) on delete cascade,
  primary key (profile_id, chore_id)
);

-- En rad varje gång någon markerar en syssla som gjord. Tas sysslan bort
-- försvinner raderna, och därmed statistiken för den.
create table public.completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references public.chores (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  done_at timestamptz not null default now()
);

create index on public.household_members (household_id);
create index on public.pauses (household_id, profile_id);
create index on public.chore_groups (household_id);
create index on public.chores (household_id);
create index on public.chores (chore_group_id);
create index on public.chore_assignments (chore_id);
create index on public.completions (chore_id, done_at desc);
create index on public.completions (profile_id);


-- ============================================================
-- Avatarer
-- ============================================================

insert into public.avatars (id, emoji, color) values
  (1, '🦊', '#FF8A4C'),
  (2, '🐷', '#F4A6B8'),
  (3, '🐸', '#7BC67E'),
  (4, '🐥', '#FFD53D'),
  (5, '🐙', '#D15C6E'),
  (6, '🐬', '#5BA8E6'),
  (7, '🦉', '#A67C52'),
  (8, '🦄', '#B38FE0');


-- ============================================================
-- Hjälpfunktioner för reglerna
-- ============================================================
-- De är security definer så att reglerna kan läsa household_members
-- utan att reglerna på den tabellen körs igen (det skulle ge en oändlig loop).

-- Är den inloggade en godkänd medlem som inte har lämnat hushållet?
create function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household_id
      and profile_id = (select auth.uid())
      and is_approved
      and left_at is null
  );
$$;

-- Är den inloggade ägare i hushållet?
create function public.is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household_id
      and profile_id = (select auth.uid())
      and is_owner
      and is_approved
      and left_at is null
  );
$$;

-- Har den inloggade en rad i hushållet, godkänd eller inte? Används för att
-- den som väntar på godkännande ska se hushållets namn och vilka avatarer
-- som är tagna.
create function public.has_membership(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household_id
      and profile_id = (select auth.uid())
      and left_at is null
  );
$$;

-- Är den inloggade med i något hushåll där den andra personen också finns?
create function public.shares_household(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members other on other.household_id = me.household_id
    where me.profile_id = (select auth.uid())
      and me.left_at is null
      and other.profile_id = p_profile_id
  );
$$;

-- Vilket hushåll en syssla hör till.
create function public.chore_household_id(p_chore_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.chores where id = p_chore_id;
$$;


-- ============================================================
-- Regler (Row Level Security)
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.avatars enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.pauses enable row level security;
alter table public.chore_groups enable row level security;
alter table public.chores enable row level security;
alter table public.chore_assignments enable row level security;
alter table public.completions enable row level security;

-- profiles: man ser sig själv och dem man delar hushåll med, och ändrar bara sig själv.
create policy "Se egen profil och hushållets profiler" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_household(id));

create policy "Ändra egen profil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- avatars: alla inloggade får läsa listan.
create policy "Läsa avatarer" on public.avatars
  for select to authenticated
  using (true);

-- households: skapas med create_household() och hittas med join_household().
create policy "Se egna hushåll" on public.households
  for select to authenticated
  using (public.has_membership(id));

create policy "Ägare ändrar hushållet" on public.households
  for update to authenticated
  using (public.is_household_owner(id))
  with check (public.is_household_owner(id));

create policy "Ägare tar bort hushållet" on public.households
  for delete to authenticated
  using (public.is_household_owner(id));

-- household_members: rader skapas med create_household() och join_household().
create policy "Se hushållets medlemmar" on public.household_members
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.has_membership(household_id));

-- Man får ändra sin egen rad (avatar, lämna) och ägare får ändra allas.
-- Triggern guard_member_update stoppar att någon gör sig själv till ägare.
create policy "Ändra egen rad eller som ägare" on public.household_members
  for update to authenticated
  using (profile_id = (select auth.uid()) or public.is_household_owner(household_id))
  with check (profile_id = (select auth.uid()) or public.is_household_owner(household_id));

-- Ägare nekar förfrågningar genom att ta bort raden. Man kan också dra
-- tillbaka sin egen förfrågan innan den är godkänd.
create policy "Neka eller dra tillbaka förfrågan" on public.household_members
  for delete to authenticated
  using (
    public.is_household_owner(household_id)
    or (profile_id = (select auth.uid()) and not is_approved)
  );

-- pauses: medlemmar ser pauserna, ägare hanterar dem.
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

create policy "Ägare tar bort pauser" on public.pauses
  for delete to authenticated
  using (public.is_household_owner(household_id));

-- chore_groups: medlemmar ser grupperna, ägare hanterar dem.
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

create policy "Ägare tar bort grupper" on public.chore_groups
  for delete to authenticated
  using (public.is_household_owner(household_id));

-- chores: medlemmar ser sysslorna, ägare lägger till, ändrar och tar bort.
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

create policy "Ägare tar bort sysslor" on public.chores
  for delete to authenticated
  using (public.is_household_owner(household_id));

-- chore_assignments: medlemmar ser vem som har vad, ägare tilldelar.
create policy "Se tilldelningar" on public.chore_assignments
  for select to authenticated
  using (public.is_household_member(public.chore_household_id(chore_id)));

create policy "Ägare tilldelar sysslor" on public.chore_assignments
  for insert to authenticated
  with check (public.is_household_owner(public.chore_household_id(chore_id)));

create policy "Ägare tar bort tilldelningar" on public.chore_assignments
  for delete to authenticated
  using (public.is_household_owner(public.chore_household_id(chore_id)));

-- completions: medlemmar ser allt och markerar sysslor som gjorda i eget namn.
create policy "Se gjorda sysslor" on public.completions
  for select to authenticated
  using (public.is_household_member(public.chore_household_id(chore_id)));

create policy "Markera syssla som gjord" on public.completions
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and public.is_household_member(public.chore_household_id(chore_id))
  );

-- Ångra en markering: sin egen, eller vilken som helst om man är ägare.
create policy "Ångra gjord syssla" on public.completions
  for delete to authenticated
  using (
    (profile_id = (select auth.uid()) and public.is_household_member(public.chore_household_id(chore_id)))
    or public.is_household_owner(public.chore_household_id(chore_id))
  );


-- ============================================================
-- Triggers
-- ============================================================

-- Skapar en profil automatiskt när någon registrerar sig.
-- Namnet kan skickas med vid registreringen:
-- supabase.auth.signUp({ email, password, options: { data: { name } } })
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- En vanlig medlem får bara ändra sin avatar och lämna (sätta left_at) på sin egen rad.
-- Allt annat (ägare, godkänd, vilket hushåll) får bara en ägare ändra.
-- Funktionerna nedan (create_household m.fl.) körs som en annan databasroll
-- och släpps igenom.
create function public.guard_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' or public.is_household_owner(old.household_id) then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
    or new.household_id is distinct from old.household_id
    or new.is_owner is distinct from old.is_owner
    or new.is_approved is distinct from old.is_approved
    or new.joined_at is distinct from old.joined_at
    -- Den som har lämnat måste gå med igen via join_household().
    or (old.left_at is not null and new.left_at is null)
  then
    raise exception 'Bara en ägare kan ändra det här';
  end if;

  return new;
end;
$$;

create trigger guard_member_update
  before update on public.household_members
  for each row execute function public.guard_member_update();


-- ============================================================
-- Funktioner som appen anropar: supabase.rpc("namn", { ... })
-- ============================================================

-- Skapar en enkel kod på 6 tecken, utan tecken som är lätta att blanda ihop (0/O, 1/I).
create function public.generate_household_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
      into new_code
      from generate_series(1, 6);
    exit when not exists (select 1 from public.households where code = new_code);
  end loop;
  return new_code;
end;
$$;

-- Skapar ett hushåll med en kod och gör den inloggade till ägare.
-- supabase.rpc("create_household", { p_name: "Familjen" })
create function public.create_household(p_name text)
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

  insert into public.household_members (profile_id, household_id, is_owner, is_approved)
  values ((select auth.uid()), new_household.id, true, true);

  return new_household;
end;
$$;

-- Skickar en förfrågan om att gå med i hushållet med koden. En ägare
-- godkänner den genom att sätta is_approved = true på raden.
-- supabase.rpc("join_household", { p_code: "AB12CD" })
create function public.join_household(p_code text)
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
  where code = upper(trim(p_code));

  if found_household_id is null then
    raise exception 'Det finns inget hushåll med koden %', p_code;
  end if;

  select * into existing
  from public.household_members
  where household_id = found_household_id and profile_id = (select auth.uid());

  if existing.profile_id is not null and existing.left_at is null then
    raise exception 'Du är redan med i hushållet eller väntar på svar';
  end if;

  if existing.profile_id is not null then
    -- Har lämnat tidigare: gör om raden till en ny förfrågan.
    update public.household_members
    set left_at = null, is_approved = false, is_owner = false, joined_at = now()
    where household_id = found_household_id and profile_id = (select auth.uid());
  else
    insert into public.household_members (profile_id, household_id)
    values ((select auth.uid()), found_household_id);
  end if;

  return found_household_id;
end;
$$;

-- Sätter bild och ljud på en syssla. Alla medlemmar får göra det, medan
-- resten av sysslan bara kan ändras av en ägare.
-- supabase.rpc("set_chore_media", { p_chore_id, p_image_path, p_audio_path })
create function public.set_chore_media(p_chore_id uuid, p_image_path text, p_audio_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_household_member(public.chore_household_id(p_chore_id)) then
    raise exception 'Du är inte med i hushållet';
  end if;

  update public.chores
  set image_path = p_image_path, audio_path = p_audio_path
  where id = p_chore_id;
end;
$$;


-- ============================================================
-- Statistik
-- ============================================================

-- Sysslorna med när de senast gjordes. Dagar sedan och försenad räknas ut i
-- appen (src/utils/chores.ts) eftersom det beror på dagens datum.
-- supabase.from("chores_with_last_done").select("*").eq("household_id", id)
create view public.chores_with_last_done
with (security_invoker = true)
as
select
  c.*,
  (select max(done_at) from public.completions where chore_id = c.id) as last_done_at
from public.chores c;

grant select on public.chores_with_last_done to authenticated;

-- Statistik för ett hushåll mellan två datum (p_to räknas inte med).
-- En rad per medlem och syssla:
--   completions        antal gånger sysslan gjordes
--   points             summan av vikterna
--   active_days        dagar i perioden då medlemmen inte var pausad
--   normalized_points  points uppskalat till hela perioden, så att den som
--                      varit pausad halva perioden inte ser ut att ha gjort hälften
-- Sysslor som gjorts under en paus räknas inte. Datum räknas i svensk tid.
-- supabase.rpc("household_stats", { p_household_id, p_from: "2026-10-12", p_to: "2026-10-19" })
create function public.household_stats(p_household_id uuid, p_from date, p_to date)
returns table (
  profile_id uuid,
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
    select distinct p.profile_id, days.day
    from public.pauses p
    join days on days.day >= p.start_date and (p.end_date is null or days.day <= p.end_date)
    where p.household_id = p_household_id
  ),
  active as (
    select m.profile_id, count(days.day)::int as active_days
    from public.household_members m
    cross join days
    where m.household_id = p_household_id
      and not exists (
        select 1 from paused_days pd
        where pd.profile_id = m.profile_id and pd.day = days.day
      )
    group by m.profile_id
  ),
  done as (
    select
      c.profile_id,
      c.chore_id,
      count(*)::int as completions,
      sum(ch.weight)::int as points
    from public.completions c
    join public.chores ch on ch.id = c.chore_id
    where ch.household_id = p_household_id
      and (c.done_at at time zone 'Europe/Stockholm')::date >= p_from
      and (c.done_at at time zone 'Europe/Stockholm')::date < p_to
      and not exists (
        select 1 from paused_days pd
        where pd.profile_id = c.profile_id
          and pd.day = (c.done_at at time zone 'Europe/Stockholm')::date
      )
    group by c.profile_id, c.chore_id
  )
  select
    done.profile_id,
    done.chore_id,
    done.completions,
    done.points,
    coalesce(active.active_days, 0),
    case
      when coalesce(active.active_days, 0) = 0 then null
      else round(done.points * (p_to - p_from)::numeric / active.active_days, 2)
    end
  from done
  left join active on active.profile_id = done.profile_id
  where public.is_household_member(p_household_id);
$$;


-- ============================================================
-- Vem får anropa funktionerna
-- ============================================================

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.create_household(text),
  public.join_household(text),
  public.set_chore_media(uuid, text, text),
  public.household_stats(uuid, date, date),
  public.is_household_member(uuid),
  public.is_household_owner(uuid),
  public.has_membership(uuid),
  public.shares_household(uuid),
  public.chore_household_id(uuid)
to authenticated;


-- ============================================================
-- Bilder och ljud till sysslor
-- ============================================================
-- Filerna läggs i en mapp per hushåll: chore-media/<household_id>/<filnamn>.
-- Bucketen är privat, så appen hämtar filerna med createSignedUrl().

insert into storage.buckets (id, name, public)
values ('chore-media', 'chore-media', false)
on conflict (id) do nothing;

-- Är den inloggade medlem i hushållet som filens mapp tillhör?
create function public.can_access_chore_media(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text := split_part(p_object_name, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_household_member(folder::uuid);
end;
$$;

grant execute on function public.can_access_chore_media(text) to authenticated;

create policy "Medlemmar läser hushållets filer" on storage.objects
  for select to authenticated
  using (bucket_id = 'chore-media' and public.can_access_chore_media(name));

create policy "Medlemmar laddar upp filer" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chore-media' and public.can_access_chore_media(name));

create policy "Medlemmar ersätter filer" on storage.objects
  for update to authenticated
  using (bucket_id = 'chore-media' and public.can_access_chore_media(name))
  with check (bucket_id = 'chore-media' and public.can_access_chore_media(name));

create policy "Medlemmar tar bort filer" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chore-media' and public.can_access_chore_media(name));
