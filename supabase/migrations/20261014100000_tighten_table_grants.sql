-- Supabase ger anon och authenticated alla rättigheter på nya tabeller och
-- vyer, bland annat TRUNCATE som tömmer en hel tabell förbi reglerna (RLS).
-- Den som inte är inloggad behöver inga rättigheter alls, och inloggade
-- behöver bara läsa, lägga till och ändra. Vad de får göra avgör reglerna.

revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Vyn används bara för att läsa.
revoke insert, update, delete on public.chores_with_last_done from authenticated;
