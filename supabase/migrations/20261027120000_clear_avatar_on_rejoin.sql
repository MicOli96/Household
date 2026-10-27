-- Den som går med igen får ett nytt djur av appen, så att det gamla inte
-- krockar med någon som har tagit det under tiden.
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
    set deleted_at = null, is_approved = false, is_owner = false, avatar_id = null, created_at = now()
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
