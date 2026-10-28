-- Hindra ett hushåll med godkända medlemmar från att bli utan ägare när
-- den sista ägaren lämnar eller tar bort sin egen ägarroll.
create or replace function public.prevent_last_owner_leave()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_owner
    and old.is_approved
    and old.deleted_at is null
    and (new.deleted_at is not null or not new.is_owner or not new.is_approved)
  then
    -- Serialisera ägarändringar i hushållet, så två ägare inte kan lämna
    -- samtidigt och båda se den andras ännu aktiva ägarrad.
    perform 1
    from public.households h
    where h.id = old.household_id
    for update;

    if exists (
      select 1
      from public.household_members m
      where m.household_id = old.household_id
        and m.user_id <> old.user_id
        and m.is_approved
        and m.deleted_at is null
    ) and not exists (
      select 1
      from public.household_members m
      where m.household_id = old.household_id
        and m.user_id <> old.user_id
        and m.is_owner
        and m.is_approved
        and m.deleted_at is null
    ) then
      raise exception 'Hushållet måste ha minst en ägare';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_last_owner_leave() from public, anon, authenticated;

create trigger prevent_last_owner_leave
  after update of deleted_at, is_owner, is_approved on public.household_members
  for each row execute function public.prevent_last_owner_leave();
