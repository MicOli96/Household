# Issue #32: Avatarer vid utförda sysslor

## Beteende

- Det befintliga `insertCompletion` sparar `chore_id` och den inloggades
  `user_id` via `requireUser`. RLS kontrollerar att user_id är den inloggade och
  att användaren tillhör hushållet. Ingen ny väg för att registrera utföranden införs.
- `HouseholdData` kopplar utföranden till medlemmarna genom userId. Varje person
  visas en gång per syssla och kalenderdag. Alla utföranderader finns kvar för statistiken.
- Dagsvyn visar dagens utförare med den befintliga färgade `Avatar`-komponenten.
  Detaljvyn visar utförarna den senaste kalenderdag sysslan gjordes, även före idag.
- `CompletedBy` använder stabila userId-nycklar, läsbara namn för skärmläsare och
  en neutral initial när en person inte har valt avatar. Ingen avatar tilldelas automatiskt.
- Statistikens totaldiagram visar avatar även med en enda utförare. Under varje
  litet diagram visas de representerade personernas avatarer. Poängberäkningen ändras inte.
- Datalagret hämtar även godkända medlemmar som lämnat, så att deras utföranden
  fortfarande kan kopplas till avatar i sysslans detaljvy. Listan över aktiva medlemmar
  och tilldelningar filtreras precis som tidigare. Statistikens befintliga avgränsning
  till aktiva medlemmar ändras inte av denna issue.

## Samordning

Avatarval och unika avatarer i hushållet hör till #29/#30. Denna implementation
läser befintligt avatar_id. Vid framtida sparande av avatar behöver profilfunktionen
invalidera React Query-nyckeln `["chores"]`, precis som dagens namnändring gör.
Vyerna använder medlemslistorna `completedTodayBy` och `lastCompletedBy` för att
bevara identiteten. Det oanvända emoji-fältet har tagits bort. Diagrammets
`avatarSize` skickas till avatarerna och centreras med `(avatarSize + 8) / 2`.
Inga nya paket, databasmigrationer eller ändringar i avatarväljaren ingår.

## Kontroller

- `npm run typecheck`
- `npm run lint`
- `node --experimental-strip-types --test tests/completionMembers.test.mjs`

Testerna täcker dubbletter per användare, olika personer med samma emoji,
medlem utan avatar, tidigare medlem, ångrat utförande, okänd användare,
uppdaterad avatar samt lokal midnatt och årsskifte. På vissa Node-versioner
kan testkommandot ge en ofarlig varning om modulformat; ändra inte gruppens
package.json enbart för att dölja den.

## Sluttest på telefon (återstår)

Lokal uppstart är blockerad av en ogiltig Supabase-URL i miljökonfigurationen.
Typkontroll, lint, logiktester och simulerad komponentrendering har passerat;
telefonlayout och flödet mot riktig backend är inte verifierade.

När gruppens riktiga URL och publishable key finns lokalt:

1. Starta om Expo. Använd två godkända konton i samma hushåll med olika sparade
   avatarer. Avatarvalet måste stödjas av #29/#30 eller testkontona vara förberedda.
2. Registrera samma syssla från konto A. Kontrollera att completions.user_id är A
   och att A:s avatar visas i dagsvyn och detaljvyn efter uppdatering.
3. Registrera sysslan från konto B. Uppdatera vyn: båda avatarerna ska visas.
4. Registrera igen från A. A ska visas en gång; statistiken ska fortfarande räkna
   båda registreringarna. Kontrollera att inget extra utförande skapats av avatarvisningen.
5. Testa en medlem utan avatar: utförandet ska fortfarande synas med initial.
6. Testa detaljvyn med ett utförande före idag och en syssla utan några utföranden.
7. Kontrollera statistiken med en respektive flera utförare, ljust/mörkt läge,
   långt sysselnamn, flera avatarer och skärmläsare.

Öppna PR för granskning, men markera inte telefon-/backendtestet som klart innan
stegen ovan har körts.
