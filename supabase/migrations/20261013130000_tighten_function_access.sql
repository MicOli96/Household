-- Tar bort rättigheter till funktioner som appen inte ska kunna anropa direkt.
-- Supabase ger inloggade (och ibland anon) rätt att köra nya funktioner som
-- standard, så de här behöver stängas uttryckligen.

-- Används bara av reglerna för filer, inte av den som inte är inloggad.
revoke execute on function public.can_access_chore_media(text) from public, anon;

-- Triggerfunktioner körs av databasen, aldrig via supabase.rpc().
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_member_update() from public, anon, authenticated;

-- Anropas bara inifrån create_household().
revoke execute on function public.generate_household_code() from public, anon, authenticated;
