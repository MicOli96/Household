create function public.delete_chore(p_chore_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_household_id uuid;
  removed_at timestamptz := now();
begin
  if (select auth.uid()) is null then
    raise exception 'Du måste vara inloggad';
  end if;

  select household_id into target_household_id
  from public.chores
  where id = p_chore_id and deleted_at is null
  for update;

  if not found or not public.is_household_owner(target_household_id) then
    raise exception 'Kunde inte ta bort sysslan. Bara ägare kan ta bort befintliga sysslor.';
  end if;

  update public.completions
  set deleted_at = removed_at
  where chore_id = p_chore_id and deleted_at is null;

  update public.chore_assignments
  set deleted_at = removed_at
  where chore_id = p_chore_id and deleted_at is null;

  update public.chores
  set deleted_at = removed_at
  where id = p_chore_id;

  return p_chore_id;
end;
$$;

revoke all on function public.delete_chore(uuid) from public, anon, authenticated;
grant execute on function public.delete_chore(uuid) to authenticated;
