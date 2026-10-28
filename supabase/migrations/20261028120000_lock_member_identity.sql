-- Ett medlemskap kan inte flyttas till ett annat hushåll eller en annan
-- användare. Tidigare släpptes ägare igenom helt, så den som var ägare i ett
-- eget hushåll kunde flytta sin ägarrad till ett annat hushåll och bli ägare
-- där utan att någon godkände det. Bara funktionerna i databasen (t.ex.
-- join_household) får skapa medlemskap.
create or replace function public.guard_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.household_id is distinct from old.household_id
  then
    raise exception 'Ett medlemskap kan inte flyttas';
  end if;

  if public.is_household_owner(old.household_id) then
    return new;
  end if;

  -- En vanlig medlem får bara ändra namn och avatar och lämna (sätta deleted_at)
  -- på sin egen rad.
  if new.is_owner is distinct from old.is_owner
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
